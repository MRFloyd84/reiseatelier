'use strict';
/* Notfallkarte: zentrale Nummern, örtliche Notrufe, deutsche Vertretungen je Land der Route
   und eigene Angaben (Versicherung, Kontakte, Kabine) – alles offline verfügbar. */
(function(){
const E=globalThis.EmergencyData;
const q=s=>document.querySelector(s);
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let names=null;try{names=new Intl.DisplayNames(['de'],{type:'region'});}catch{}
const cn=cc=>{try{return names?.of(cc)||cc;}catch{return cc;}};
const flag=cc=>/^[A-Z]{2}$/.test(cc)?String.fromCodePoint(...[...cc].map(c=>127397+c.charCodeAt(0))):'';
const telHref=p=>'tel:'+String(p).replace(/[^\d+]/g,'');
const tel=(p,cls='')=>p?`<a class="em-tel ${cls}" href="${h(telHref(p))}">${h(p)}</a>`:'';
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function trip(){try{return state;}catch{return {destinations:[],settings:{}};}}
function sortedStops(){return [...(trip().destinations||[])].sort((a,b)=>(a.start+(a.arrival||'')).localeCompare(b.start+(b.arrival||'')));}
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
// Heutige bzw. nächste Station (nur während/kurz vor der Reise sinnvoll)
function current(){const ds=sortedStops(),today=iso(new Date());const d=ds.find(x=>(x.end||x.start)>=today);if(!d)return null;return {d,today:d.start<=today};}
function matches(m,d){if(!m.ports||!d)return false;const t=norm(d.city)+' '+norm(d.name);return m.ports.some(p=>t.includes(norm(p)));}
function missionHtml(m,d){const hit=matches(m,d);return `<li class="em-mission${hit?' em-hit':''}"><strong>${h(m.name)}</strong>${hit?'<span class="em-badge">für diesen Hafen</span>':''}<span class="em-nums">${m.phone?`<span>Zentrale ${tel(m.phone)}</span>`:''}${m.emergency?`<span>Notfall ${tel(m.emergency,'em-red')}</span>`:''}</span>${m.note?`<small>${h(m.note)}</small>`:''}</li>`;}
function portInfo(d){if(!d||!(d.agent||d.agentPhone||d.berth))return '';return `<p class="em-port">${d.berth?`<span>Liegeplatz: <b>${h(d.berth)}</b></span>`:''}${d.agent||d.agentPhone?`<span>Hafenagent: ${h(d.agent)} ${tel(d.agentPhone,'em-red')}</span>`:''}</p>`;}
function stopsHtml(stops){const ports=stops.filter(s=>s.kind==='hafen'||s.agent||s.berth);if(!ports.length)return '';return `<h4>Häfen</h4><ul class="em-stops">${ports.map(s=>`<li><span><strong>${h(s.city||s.name)}</strong> <small>${h(new Date(s.start+'T12:00').toLocaleDateString('de-DE',{day:'2-digit',month:'short',year:'numeric'}))}</small></span>${portInfo(s)||'<small class="muted">Hafenagent noch nicht eingetragen</small>'}<button type="button" class="secondary small-btn" data-taxi="${h(s.id)}">🚕 Taxi-Karte</button></li>`).join('')}</ul>`;}
function countryHtml(c,{stops=[],open=false,d=null}={}){
  const missions=[...c.missions].sort((a,b)=>matches(b,d)-matches(a,d));
  const ports=stops.length?stops.map(s=>s.city||s.name).filter((v,i,a)=>a.indexOf(v)===i).join(', '):'';
  return `<details class="panel em-country${open?' em-now':''}"${open?' open':''} data-cc="${c.cc}"><summary><span class="em-flag" aria-hidden="true">${flag(c.cc)}</span><span class="em-cname"><strong>${h(cn(c.cc))}</strong>${ports?`<small>${h(ports)}</small>`:''}</span><span class="em-sos">${h(c.sos)}</span></summary>
  <div class="em-body"><p class="em-local"><a class="em-sosbtn" href="${h(telHref(c.sos))}">☎ Notruf ${h(c.sos)}</a><span>${h(c.sosText)}</span></p>${missions.length?`<h4>Deutsche Vertretungen</h4><ul class="em-missions">${missions.map(m=>missionHtml(m,d)).join('')}</ul>`:''}${stopsHtml(stops)}${c.note?`<p class="small">${h(c.note)}</p>`:''}</div></details>`;}

// ---- Taxi-Karte ----
const SHIP='AIDAdiva';
const LANG={
 de:{n:'Deutsch',go:'Bitte bringen Sie mich zum Kreuzfahrtterminal.',ship:'Schiff',port:'Hafen',berth:'Liegeplatz',by:'Ich muss an Bord sein bis',pay:'Was kostet die Fahrt?'},
 en:{n:'Englisch',go:'Please take me to the cruise ship terminal.',ship:'Ship',port:'Port',berth:'Berth',by:'I must be on board by',pay:'How much will it cost?'},
 es:{n:'Spanisch',go:'Por favor, lléveme a la terminal de cruceros.',ship:'Barco',port:'Puerto',berth:'Muelle',by:'Tengo que estar a bordo antes de las',pay:'¿Cuánto cuesta el viaje?'},
 fr:{n:'Französisch',go:'Conduisez-moi au terminal des croisières, s’il vous plaît.',ship:'Navire',port:'Port',berth:'Quai',by:'Je dois être à bord avant',pay:'Combien coûte la course ?'},
 pt:{n:'Portugiesisch',go:'Por favor, leve-me ao terminal de cruzeiros.',ship:'Navio',port:'Porto',berth:'Cais',by:'Preciso estar a bordo até às',pay:'Quanto custa a corrida?'},
 id:{n:'Indonesisch',go:'Tolong antar saya ke terminal kapal pesiar.',ship:'Kapal',port:'Pelabuhan',berth:'Dermaga',by:'Saya harus naik kapal sebelum pukul',pay:'Berapa ongkosnya?'},
 ms:{n:'Malaiisch',go:'Tolong hantar saya ke terminal kapal persiaran.',ship:'Kapal',port:'Pelabuhan',berth:'Dermaga',by:'Saya mesti naik kapal sebelum pukul',pay:'Berapa tambangnya?'}};
const CC_LANG={DE:['de'],GB:['en'],CA:['en'],US:['en'],MX:['es','en'],BZ:['en'],HN:['es','en'],CR:['es','en'],PA:['es','en'],GT:['es','en'],PF:['fr','en'],CK:['en'],NC:['fr','en'],AU:['en'],ID:['id','en'],SG:['en'],MY:['ms','en'],LK:['en'],MV:['en'],SC:['en','fr'],MU:['fr','en'],RE:['fr','en'],ZA:['en'],BR:['pt','en'],CV:['pt','en'],ES:['es','en'],PT:['pt','en']};
function taxiDialog(){let d=q('#taxi-dialog');if(!d){d=document.createElement('dialog');d.id='taxi-dialog';d.className='taxi-dialog';document.body.append(d);d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-taxi-close]'))d.close();});}return d;}
function openTaxi(id){const d=(trip().destinations||[]).find(x=>x.id===id);if(!d)return;const langs=CC_LANG[d.country]||['en'];const a=TravelCore.aboard(d);const port=d.city||d.name;
  const block=(l,main)=>{const t=LANG[l];return `<div class="taxi-lang${main?' main':''}"><p class="taxi-go">${h(t.go)}</p><dl><div><dt>${h(t.ship)}</dt><dd>${SHIP}</dd></div><div><dt>${h(t.port)}</dt><dd>${h(port)}</dd></div>${d.berth?`<div><dt>${h(t.berth)}</dt><dd>${h(d.berth)}</dd></div>`:''}</dl>${a?`<p class="taxi-by">${h(t.by)} <b>${h(a.time)}</b></p>`:''}${main?`<p class="taxi-pay">${h(t.pay)}</p>`:''}</div>`;};
  const dlg=taxiDialog();dlg.innerHTML=`<div class="taxi-top"><span>${flag(d.country)} Taxi-Karte · ${h(LANG[langs[0]].n)}</span><button type="button" class="icon-btn" data-taxi-close aria-label="Schließen">×</button></div>${langs.map((l,i)=>block(l,i===0)).join('')}<p class="taxi-de">Deutsch: ${h(LANG.de.go)}${a?' Wir müssen bis '+h(a.time)+' an Bord sein.':''}</p>`;dlg.showModal();}

// ---- Schiff verpasst ----
function nextPort(d){const ds=sortedStops(),i=ds.findIndex(x=>x.id===d.id);return ds.slice(i+1).find(x=>x.kind==='hafen'&&x.country)||ds[i+1]||null;}
function missedHtml(cur){const d=cur?.d,c=d&&E.byCC[d.country],n=d&&nextPort(d);const m=c?[...c.missions].sort((a,b)=>matches(b,d)-matches(a,d))[0]:null;const svc=E.CENTRAL.find(x=>/AIDA/.test(x.label));
  const fmt=x=>new Date(x.start+'T12:00').toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'long'});
  const steps=[
   ['Ruhe bewahren und sofort den Hafenagenten anrufen',d?.agentPhone?`${h(d.agent||'Hafenagent')} · ${tel(d.agentPhone,'em-red')}`:'Die Nummer steht in der AIDA-Tagesinfo'+(d?` – tragt sie bei „${h(d.city||d.name)}“ ein (Stift-Symbol in „Meine Route“)`:'')+'. Sonst am Terminal oder bei der Hafenbehörde nach dem Agenten von AIDA fragen.'],
   ['AIDA Service anrufen (24 h)',svc?tel(svc.phone,'em-red'):''],
   ['Pass, Bordkarte und Kreditkarte bereithalten','Der Agent hilft bei der Weiterreise zum nächsten Hafen. Die Kosten tragt ihr in der Regel selbst – außer bei Ausflügen, die über AIDA gebucht sind.'],
   ['Nächster Hafen',n?`${flag(n.country)} <b>${h(n.city||n.name)}</b>, ${h(cn(n.country))} · ${h(fmt(n))}${n.arrival?' · Ankunft '+h(n.arrival):''}`:'Siehe „Meine Route“.'],
   ['Pass an Bord oder verloren?',m?`Die deutsche Vertretung stellt einen Notreiseausweis aus: ${h(m.name)} ${tel(m.phone)}${m.emergency?' · Notfall '+tel(m.emergency,'em-red'):''}`:'Die deutsche Vertretung im Land hilft mit einem Notreiseausweis (siehe Länderliste unten).']];
  return `<details class="panel em-missed" id="em-missed"><summary><span class="hs-icon" aria-hidden="true">⚓</span><span><strong>Schiff verpasst – was tun?</strong><small>${d?'Für '+h(d.city||d.name):'Schritt für Schritt'}</small></span></summary><ol>${steps.map(([t,x])=>`<li><strong>${t}</strong><span>${x}</span></li>`).join('')}</ol></details>`;}

// ---- Dokumentfotos (nur auf diesem Gerät) ----
const DOC_LABELS=['Reisepass','Personalausweis','Versicherungskarte','Impfausweis','Führerschein','Sonstiges'];
function docDb(){return new Promise((res,rej)=>{const r=indexedDB.open('reiseatelier-docs',1);r.onupgradeneeded=()=>r.result.createObjectStore('docs',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function docTx(mode,fn){const db=await docDb();return new Promise((res,rej)=>{const t=db.transaction('docs',mode),st=t.objectStore('docs');const out=fn(st);t.oncomplete=()=>{db.close();res(out?.result);};t.onerror=()=>{db.close();rej(t.error);};});}
const docs={list:()=>docTx('readonly',st=>st.getAll()),put:x=>docTx('readwrite',st=>st.put(x)),del:id=>docTx('readwrite',st=>st.delete(id))};
let docCache=null;
function readImage(file){return new Promise((res,rej)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);res(img);};img.onerror=()=>{URL.revokeObjectURL(url);rej(Error('Bild konnte nicht gelesen werden.'));};img.src=url;});}
async function shrinkDoc(file){const img=await readImage(file);const s=Math.min(1,2000/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*s);c.height=Math.round(img.naturalHeight*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.85);}
function docsHtml(){return `<section class="panel em-docs"><div class="home-panel-head"><h3>Dokumente</h3><span class="em-local-only">nur auf diesem Gerät</span></div><p class="small">Fotos von Pass, Ausweis und Versicherungskarte helfen bei Verlust enorm. Sie bleiben nur auf diesem Gerät – sie kommen nicht in die Abgleich-Datei und nicht in Sicherungen. Jede legt ihre eigenen an.</p><div id="em-doc-list" class="em-doc-list">${docCache===null?'<p class="muted">Wird geladen …</p>':docCache.length?docCache.map(x=>`<figure class="em-doc"><button type="button" class="em-doc-img" data-doc-open="${h(x.id)}"><img src="${x.data}" alt="${h(x.label)}"></button><figcaption>${h(x.label)}<button type="button" class="icon-btn small" data-doc-del="${h(x.id)}" aria-label="${h(x.label)} löschen">×</button></figcaption></figure>`).join(''):'<p class="muted">Noch keine Dokumente.</p>'}</div><div class="button-row em-doc-add"><select id="em-doc-label" aria-label="Art des Dokuments">${DOC_LABELS.map(l=>`<option>${l}</option>`).join('')}</select><button type="button" class="secondary" id="em-doc-btn">＋ Foto hinzufügen</button><input type="file" id="em-doc-file" accept="image/*" hidden></div></section>`;}
async function loadDocs(){try{docCache=(await docs.list()).sort((a,b)=>a.added.localeCompare(b.added));}catch{docCache=[];}const el=q('#em-docs-slot');if(el){el.innerHTML=docsHtml();}}
function openDoc(id){const x=docCache?.find(d=>d.id===id);if(!x)return;let dlg=q('#doc-dialog');if(!dlg){dlg=document.createElement('dialog');dlg.id='doc-dialog';dlg.className='doc-dialog';document.body.append(dlg);dlg.addEventListener('click',()=>dlg.close());}dlg.innerHTML=`<p>${h(x.label)} · antippen zum Schließen</p><img src="${x.data}" alt="${h(x.label)}">`;dlg.showModal();}
document.addEventListener('click',async e=>{const t=e.target;
  if(t.closest?.('[data-missed]')){const m=q('#em-missed');if(m){m.open=true;m.scrollIntoView({behavior:'smooth',block:'start'});}return;}
  const tx=t.closest?.('[data-taxi]');if(tx){openTaxi(tx.dataset.taxi);return;}
  if(t.closest?.('#em-doc-btn')){q('#em-doc-file').click();return;}
  const o=t.closest?.('[data-doc-open]');if(o){openDoc(o.dataset.docOpen);return;}
  const del=t.closest?.('[data-doc-del]');if(del){const x=docCache?.find(d=>d.id===del.dataset.docDel);const ok=await confirmAction('Dokument löschen?',`„${x?.label||'Dokument'}“ wird von diesem Gerät entfernt.`,[{label:'Abbrechen',value:false},{label:'Löschen',value:true,className:'danger-btn'}]);if(ok){await docs.del(del.dataset.docDel);await loadDocs();notify('Dokument gelöscht.');}}});
document.addEventListener('change',async e=>{if(e.target.id!=='em-doc-file')return;const f=e.target.files?.[0];e.target.value='';if(!f)return;try{const data=await shrinkDoc(f);await docs.put({id:crypto.randomUUID(),label:q('#em-doc-label').value,data,added:new Date().toISOString()});await loadDocs();notify('Dokument gespeichert – nur auf diesem Gerät.');}catch(err){notify('Foto konnte nicht gespeichert werden: '+err.message);}});
function own(){const e=trip().settings?.emergency||{};return e;}
const FIELDS=[
  ['insurer','Auslandskrankenversicherung','z. B. Name der Versicherung'],['insurerPhone','Notruf der Versicherung','+49 …','tel'],['policy','Versicherungsnummer',''],
  ['contactName','Kontaktperson 1','Name'],['contactPhone','Telefon Kontaktperson 1','+49 …','tel'],
  ['contact2Name','Kontaktperson 2','Name'],['contact2Phone','Telefon Kontaktperson 2','+49 …','tel'],
  ['cabin','Kabine','z. B. 8123'],['doctor','Hausarzt / Ärztin','Name und Telefon']];
function ownView(){const e=own(),rows=[];
  if(e.insurer||e.insurerPhone||e.policy)rows.push(['Versicherung',`${h(e.insurer)}${e.insurerPhone?' · '+tel(e.insurerPhone,'em-red'):''}${e.policy?`<small>Nr. ${h(e.policy)}</small>`:''}`]);
  for(const [n,p] of [['contactName','contactPhone'],['contact2Name','contact2Phone']])if(e[n]||e[p])rows.push(['Kontakt',`${h(e[n])}${e[p]?' · '+tel(e[p]):''}`]);
  if(e.cabin)rows.push(['Kabine',h(e.cabin)]);
  if(e.doctor)rows.push(['Arzt',h(e.doctor)]);
  if(e.medical)rows.push(['Medizinisches',`<span class="em-pre">${h(e.medical)}</span>`]);
  if(e.notes)rows.push(['Notizen',`<span class="em-pre">${h(e.notes)}</span>`]);
  return rows.length?`<dl class="em-own">${rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`:'<p class="muted">Noch keine eigenen Angaben. Tragt hier Versicherung, Kontaktpersonen und Kabine ein – das wird mit dem Abgleich geteilt.</p>';}
let editing=false;
function ownForm(){const e=own();return `<form id="em-form" class="form-grid">${FIELDS.map(([k,l,p,t])=>`<label${k==='doctor'?' class="wide"':''}>${l}<input name="${k}" ${t?`type="${t}" inputmode="tel"`:''} maxlength="200" placeholder="${h(p)}" value="${h(e[k])}"></label>`).join('')}<label class="wide">Medizinisches (Allergien, Medikamente, Blutgruppe)<textarea name="medical" rows="3" maxlength="2000">${h(e.medical)}</textarea></label><label class="wide">Weitere Notizen<textarea name="notes" rows="2" maxlength="2000">${h(e.notes)}</textarea></label><div class="wide button-row"><button class="primary">Angaben speichern</button><button type="button" class="secondary" id="em-cancel">Abbrechen</button></div></form>`;}
function render(){const el=q('#notfall');if(!el||el.hidden)return;const box=q('#notfall-content');if(!box||!E)return;
  const ds=sortedStops(),cur=current();
  const byCountry=new Map();for(const d of ds){if(!byCountry.has(d.country))byCountry.set(d.country,[]);byCountry.get(d.country).push(d);}
  let order=[...byCountry.keys()].filter(cc=>E.byCC[cc]);if(!order.length)order=E.COUNTRIES.map(c=>c.cc);
  const missing=[...byCountry.keys()].filter(cc=>!E.byCC[cc]);
  const nowCC=cur&&E.byCC[cur.d.country]?cur.d.country:null;
  let now='';
  if(nowCC){const c=E.byCC[nowCC];now=`<section class="panel em-today"><div class="eyebrow">${cur.today?'HEUTE':'NÄCHSTE STATION · '+h(new Date(cur.d.start+'T12:00').toLocaleDateString('de-DE',{day:'2-digit',month:'long'}))}</div><h3>${flag(nowCC)} ${h(cur.d.city||cur.d.name)}, ${h(cn(nowCC))}</h3><p class="em-local"><a class="em-sosbtn big" href="${h(telHref(c.sos))}">☎ Notruf ${h(c.sos)}</a><span>${h(c.sosText)}</span></p>${(()=>{const m=[...c.missions].sort((a,b)=>matches(b,cur.d)-matches(a,cur.d))[0];return m?`<ul class="em-missions">${missionHtml(m,cur.d)}</ul>`:'';})()}${portInfo(cur.d)}<div class="button-row em-actions"><button type="button" class="primary" data-taxi="${h(cur.d.id)}">🚕 Taxi-Karte zeigen</button><button type="button" class="secondary" data-missed>⚓ Schiff verpasst?</button></div></section>`;}
  box.innerHTML=`<p class="em-onboard"><strong>An Bord zuerst:</strong> Bei einem Notfall auf dem Schiff die Rezeption oder das Bordhospital anrufen (Kabinentelefon). An Land gilt der örtliche Notruf.</p>
  ${now}
  <div class="em-grid"><section class="panel"><h3>Wichtige Nummern aus Deutschland</h3><ul class="em-list">${E.CENTRAL.map(n=>`<li><strong>${h(n.label)}</strong>${tel(n.phone,'em-red')}${n.alt?` <span class="small">oder</span> ${tel(n.alt)}`:''}${n.note?`<small>${h(n.note)}</small>`:''}</li>`).join('')}</ul>
  <h4>Für Angehörige zu Hause</h4><ul class="em-list">${E.HOME.map(n=>`<li><strong>${h(n.label)}</strong>${tel(n.phone)}${n.note?`<small>${h(n.note)}</small>`:''}</li>`).join('')}</ul></section>
  <section class="panel"><div class="home-panel-head"><h3>Eure Angaben</h3>${editing?'':'<button type="button" class="secondary small-btn" id="em-edit">Bearbeiten</button>'}</div>${editing?ownForm():ownView()}</section></div>
  ${missedHtml(cur)}
  <div id="em-docs-slot">${docsHtml()}</div>
  <div class="em-head"><h3>Länder der Route</h3><span class="small">Notruf vor Ort und deutsche Botschaften/Konsulate · Nummern antippen zum Anrufen</span></div>
  ${order.map(cc=>countryHtml(E.byCC[cc],{stops:byCountry.get(cc)||[],open:cc===nowCC,d:cc===nowCC?cur.d:null})).join('')}
  ${missing.length?`<p class="small">Für ${missing.map(cn).join(', ')} sind keine Nummern hinterlegt – bitte unter auswaertiges-amt.de nachsehen. Die zentrale Nummer des Auswärtigen Amts hilft immer weiter.</p>`:''}
  <p class="em-fine">Stand der Nummern: ${h(E.CHECKED)} (Auswärtiges Amt, AIDA, Sperr-Notruf). Telefonnummern können sich ändern – bitte kurz vor der Abreise auf auswaertiges-amt.de prüfen. Tipp: zusätzlich die App „Sicher Reisen“ des Auswärtigen Amts installieren und sich in der Krisenvorsorgeliste „Elefand“ eintragen.</p>`;
  q('#em-edit')?.addEventListener('click',()=>{editing=true;render();q('#em-form input')?.focus();});
  q('#em-cancel')?.addEventListener('click',()=>{editing=false;render();});
  q('#em-form')?.addEventListener('submit',async ev=>{ev.preventDefault();const f=ev.target.elements,next={};for(const k of TravelCore.EMERGENCY_FIELDS)next[k]=(f[k]?.value||'').trim();const s=trip();
    if(await commit({...s,settings:{...s.settings,emergency:next}},false)){editing=false;render();notify('Notfall-Angaben gespeichert.');}});
}
// Kompakter Hinweis für die Startseite
function homeStrip(){if(!E)return '';const cur=current();const c=cur&&E.byCC[cur.d.country];
  const txt=c?`${cur.today?'Heute':'Nächste Station'}: ${flag(c.cc)} ${cn(c.cc)} · Notruf ${c.sos}`:'Notrufe, Botschaften und eure Kontakte – auch offline';
  return `<a class="home-sos" href="#notfall"><span class="hs-icon" aria-hidden="true">SOS</span><span><strong>Notfall</strong><small>${h(txt)}</small></span><span class="hc-go" aria-hidden="true">›</span></a>`;}
window.TravelEmergency={show(){render();loadDocs();},onTrip(){if(!editing)render();},homeStrip};
const wait=setInterval(()=>{let r=false;try{r=ready;}catch{}if(r){clearInterval(wait);if(location.hash==='#notfall'){render();loadDocs();}}},150);
})();

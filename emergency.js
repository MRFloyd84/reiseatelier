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
function countryHtml(c,{stops=[],open=false,d=null}={}){
  const missions=[...c.missions].sort((a,b)=>matches(b,d)-matches(a,d));
  const ports=stops.length?stops.map(s=>s.city||s.name).filter((v,i,a)=>a.indexOf(v)===i).join(', '):'';
  return `<details class="panel em-country${open?' em-now':''}"${open?' open':''} data-cc="${c.cc}"><summary><span class="em-flag" aria-hidden="true">${flag(c.cc)}</span><span class="em-cname"><strong>${h(cn(c.cc))}</strong>${ports?`<small>${h(ports)}</small>`:''}</span><span class="em-sos">${h(c.sos)}</span></summary>
  <div class="em-body"><p class="em-local"><a class="em-sosbtn" href="${h(telHref(c.sos))}">☎ Notruf ${h(c.sos)}</a><span>${h(c.sosText)}</span></p>${missions.length?`<h4>Deutsche Vertretungen</h4><ul class="em-missions">${missions.map(m=>missionHtml(m,d)).join('')}</ul>`:''}${c.note?`<p class="small">${h(c.note)}</p>`:''}</div></details>`;}
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
  if(nowCC){const c=E.byCC[nowCC];now=`<section class="panel em-today"><div class="eyebrow">${cur.today?'HEUTE':'NÄCHSTE STATION · '+h(new Date(cur.d.start+'T12:00').toLocaleDateString('de-DE',{day:'2-digit',month:'long'}))}</div><h3>${flag(nowCC)} ${h(cur.d.city||cur.d.name)}, ${h(cn(nowCC))}</h3><p class="em-local"><a class="em-sosbtn big" href="${h(telHref(c.sos))}">☎ Notruf ${h(c.sos)}</a><span>${h(c.sosText)}</span></p>${(()=>{const m=[...c.missions].sort((a,b)=>matches(b,cur.d)-matches(a,cur.d))[0];return m?`<ul class="em-missions">${missionHtml(m,cur.d)}</ul>`:'';})()}</section>`;}
  box.innerHTML=`<p class="em-onboard"><strong>An Bord zuerst:</strong> Bei einem Notfall auf dem Schiff die Rezeption oder das Bordhospital anrufen (Kabinentelefon). An Land gilt der örtliche Notruf.</p>
  ${now}
  <div class="em-grid"><section class="panel"><h3>Wichtige Nummern aus Deutschland</h3><ul class="em-list">${E.CENTRAL.map(n=>`<li><strong>${h(n.label)}</strong>${tel(n.phone,'em-red')}${n.alt?` <span class="small">oder</span> ${tel(n.alt)}`:''}${n.note?`<small>${h(n.note)}</small>`:''}</li>`).join('')}</ul>
  <h4>Für Angehörige zu Hause</h4><ul class="em-list">${E.HOME.map(n=>`<li><strong>${h(n.label)}</strong>${tel(n.phone)}${n.note?`<small>${h(n.note)}</small>`:''}</li>`).join('')}</ul></section>
  <section class="panel"><div class="home-panel-head"><h3>Eure Angaben</h3>${editing?'':'<button type="button" class="secondary small-btn" id="em-edit">Bearbeiten</button>'}</div>${editing?ownForm():ownView()}</section></div>
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
window.TravelEmergency={show:render,onTrip(){if(!editing)render();},homeStrip};
const wait=setInterval(()=>{let r=false;try{r=ready;}catch{}if(r){clearInterval(wait);if(location.hash==='#notfall')render();}},150);
})();

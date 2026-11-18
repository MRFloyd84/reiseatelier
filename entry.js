'use strict';
/* Tab „Einreise“: Visa, Einreisegenehmigungen und Formulare je Land als Checkliste – pro Person abhakbar. */
(function(){
const D=globalThis.EntryData;
const q=s=>document.querySelector(s);
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let names=null;try{names=new Intl.DisplayNames(['de'],{type:'region'});}catch{}
const cn=cc=>{try{return names?.of(cc)||cc;}catch{return cc;}};
const flag=cc=>/^[A-Z]{2}$/.test(cc)?String.fromCodePoint(...[...cc].map(c=>127397+c.charCodeAt(0))):'';
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const addDays=(s,n)=>{const d=new Date(s+'T12:00');d.setDate(d.getDate()+n);return iso(d);};
const fmt=s=>new Date(s+'T12:00').toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
function trip(){try{return state;}catch{return {destinations:[],settings:{}};}}
const sorted=()=>[...(trip().destinations||[])].sort((a,b)=>(a.start+(a.arrival||'')).localeCompare(b.start+(b.arrival||'')));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
function entry(){const e=trip().settings?.entry||{};return {people:e.people||['',''],checks:e.checks||{}};}
function people(){const p=entry().people;return [p[0]||'Person 1',p[1]||'Person 2'];}

// Aufgaben mit konkretem Zeitfenster aus der aktuellen Route
function tasks(){const ds=sorted();if(!ds.length)return [];const start=ds[0].start;const out=[];
  for(const g of D.GENERAL)out.push({...g,general:true,arrive:start,from:null,until:addDays(start,-g.due)});
  for(const t of D.TASKS){const stops=ds.filter(d=>d.country===t.cc);if(!stops.length)continue;
    const s=(t.place&&stops.find(d=>norm(d.city+' '+d.name).includes(norm(t.place))))||stops[0];
    out.push({...t,arrive:s.start,port:s.city||s.name,from:t.open?addDays(s.start,-t.open):null,until:addDays(s.start,-t.due)});}
  return out.sort((a,b)=>a.until.localeCompare(b.until));}
function doneBy(t,i){return !!entry().checks[t.id+'|'+i];}
function status(t){const today=iso(new Date()),d0=doneBy(t,0),d1=doneBy(t,1);
  if(d0&&d1)return 'done';if(today>t.arrive)return 'past';if(today>t.until)return 'late';if(!t.from||today>=t.from)return (t.until<=addDays(today,30))?'now':'open';return 'wait';}
const LABEL={past:'Vorbei',done:'Erledigt',late:'Überfällig',now:'Jetzt erledigen',open:'Offen',wait:'Noch nicht möglich'};

function taskHtml(t){const st=status(t),p=people();
  const when=t.general?`bis ${fmt(t.until)}`:`${t.from?'ab '+fmt(t.from)+' · ':''}bis ${fmt(t.until)}${t.due===0?' (vor Ankunft)':''}`;
  const where=t.general?'Vor der Reise':`${flag(t.cc)} ${h(cn(t.cc))} · Ankunft ${h(t.port)} ${fmt(t.arrive)}`;
  return `<article class="panel en-task en-${st}" data-task="${h(t.id)}"><div class="en-top"><div><div class="en-where">${where}</div><h3>${h(t.title)}</h3></div><span class="en-badge">${LABEL[st]}</span></div>
  <p class="en-when">⏱ ${when}${t.cost?` · ${h(t.cost)}`:''}</p><p class="en-detail">${h(t.detail)}</p>
  <div class="en-foot">${t.link?`<a class="btn-link small-btn" href="${h(t.link)}" target="_blank" rel="noopener">Offizielle Seite ↗</a>`:''}<div class="en-checks" role="group" aria-label="Erledigt von">${p.map((n,i)=>`<label class="en-check${doneBy(t,i)?' on':''}"><input type="checkbox" data-check="${h(t.id)}|${i}"${doneBy(t,i)?' checked':''}><span>${h(n)}</span></label>`).join('')}</div></div></article>`;}

function render(){const el=q('#einreise');if(!el||el.hidden||!D)return;const box=q('#einreise-content');const ts=tasks();const ds=sorted();
  if(!ds.length){box.innerHTML='<p class="panel muted">Noch keine Route eingetragen. Sobald Stationen vorhanden sind, erscheint hier die Checkliste.</p>';return;}
  const start=ds[0].start,p=people();
  const pre=ts.filter(t=>t.general||!t.from||t.from<start),onb=ts.filter(t=>!pre.includes(t));
  const cnt=i=>ts.filter(t=>doneBy(t,i)).length;
  const routeCC=[...new Set(ds.map(d=>d.country))];
  const free=routeCC.filter(cc=>!D.TASKS.some(t=>t.cc===cc));
  const urgent=ts.filter(t=>['late','now'].includes(status(t)));
  box.innerHTML=`<div class="en-intro panel"><p><strong>Für deutsche Staatsangehörige mit Reisepass.</strong> Jede Person braucht ihre eigenen Genehmigungen – deshalb hakt ihr getrennt ab. Die Haken werden mit der Abgleich-Datei geteilt.</p>
    <div class="en-progress">${p.map((n,i)=>`<div><span>${h(n)}</span><b>${cnt(i)} / ${ts.length}</b><div class="en-bar"><i style="width:${ts.length?Math.round(cnt(i)/ts.length*100):0}%"></i></div></div>`).join('')}</div>
    <details class="en-names"><summary>Namen ändern</summary><form id="en-names" class="button-row"><input name="p0" maxlength="40" placeholder="Person 1" value="${h(entry().people[0])}" aria-label="Name Person 1"><input name="p1" maxlength="40" placeholder="Person 2" value="${h(entry().people[1])}" aria-label="Name Person 2"><button class="secondary small-btn">Speichern</button></form></details>
    ${urgent.length?`<p class="en-alert">⚠ ${urgent.length===1?'1 Aufgabe ist':urgent.length+' Aufgaben sind'} jetzt fällig: ${urgent.map(t=>h(t.title)).join(', ')}</p>`:''}</div>
  <h3 class="en-h">Vor der Abreise erledigen</h3>${pre.map(taskHtml).join('')}
  <h3 class="en-h">Unterwegs erledigen <small>– diese Formulare gehen erst kurz vor Ankunft, also an Bord mit Internet</small></h3>${onb.map(taskHtml).join('')}
  <h3 class="en-h">Keine Formalitäten nötig</h3><section class="panel en-free"><ul>${free.map(cc=>`<li><span>${flag(cc)} <strong>${h(cn(cc))}</strong></span><small>${h(D.FREE[cc]||'Für dieses Land sind keine Angaben hinterlegt – bitte beim Auswärtigen Amt prüfen.')}</small></li>`).join('')}</ul></section>
  <p class="em-fine">Stand der Recherche: ${h(D.CHECKED)} (offizielle Seiten der Länder, Auswärtiges Amt, Reederei-Hinweise). Einreiseregeln ändern sich – vor der Abreise und vor jedem Land kurz prüfen, z. B. in der App „Sicher Reisen“. Die Angaben in den AIDA-Reiseunterlagen gehen vor. Nur auf den offiziellen Seiten beantragen – Vermittler verlangen oft ein Vielfaches.</p>`;}

document.addEventListener('change',async e=>{const c=e.target.closest?.('[data-check]');if(!c)return;const s=trip(),en=entry(),checks={...en.checks};
  if(c.checked)checks[c.dataset.check]=iso(new Date());else delete checks[c.dataset.check];
  if(await commit({...s,settings:{...s.settings,entry:{people:en.people,checks}}},false))render();});
document.addEventListener('submit',async e=>{if(e.target.id!=='en-names')return;e.preventDefault();const f=e.target.elements,s=trip();
  if(await commit({...s,settings:{...s.settings,entry:{people:[f.p0.value.trim(),f.p1.value.trim()],checks:entry().checks}}},false)){render();notify('Namen gespeichert.');}});

// Hinweis für die Startseite: nur wenn etwas fällig ist
function homeStrip(){if(!D)return '';const u=tasks().filter(t=>['late','now'].includes(status(t)));if(!u.length)return '';const late=u.some(t=>status(t)==='late');
  return `<a class="home-entry${late?' late':''}" href="#einreise"><span class="hs-icon" aria-hidden="true">✓</span><span><strong>Einreise: ${u.length===1?'1 Aufgabe':u.length+' Aufgaben'} fällig</strong><small>${h(u.slice(0,2).map(t=>t.title).join(' · '))}${u.length>2?' …':''}</small></span><span class="hc-go" aria-hidden="true">›</span></a>`;}
window.TravelEntry={show:render,onTrip:render,homeStrip,tasks,status};
const wait=setInterval(()=>{let r=false;try{r=ready;}catch{}if(r){clearInterval(wait);if(location.hash==='#einreise')render();}},150);
})();

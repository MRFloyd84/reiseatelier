'use strict';
/* Abgleich über eine Datei in einem geteilten iCloud-Drive-Ordner: speichern, laden, zusammenführen. */
(function(){
const q=s=>document.querySelector(s);
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=m=>{try{notify(m);}catch{}};
function ago(iso){if(!iso)return 'noch nie';const m=Math.round((Date.now()-Date.parse(iso))/60000);if(m<1)return 'gerade eben';if(m<60)return `vor ${m} Min.`;const hh=Math.round(m/60);if(hh<24)return `vor ${hh} Std.`;const d=Math.round(hh/24);return d===1?'gestern':`vor ${d} Tagen`;}
const when=iso=>iso?new Date(iso).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'';
function statusHtml(){const s=TravelStore.sync.status();return `Auf diesem Gerät zuletzt <b>geladen ${h(ago(s.loaded))}</b> · <b>gespeichert ${h(ago(s.saved))}</b>`;}
function render(){qsa('[data-sync-status]').forEach(el=>el.innerHTML=statusHtml());
  const strip=q('#home-sync');if(strip){const s=TravelStore.sync.status(),stale=!s.loaded||Date.now()-Date.parse(s.loaded)>3*86400000;strip.classList.toggle('sync-stale',TravelStore.mode!=='shared'&&stale);}}
const qsa=s=>[...document.querySelectorAll(s)];
let busy=false;
async function save(){if(busy)return;busy=true;try{toast('Abgleich-Datei wird erstellt …');const r=await TravelStore.sync.exportFile();if(r.ok)toast(`Abgleich-Datei gespeichert (${r.entries} Tagebucheinträge, ${r.photos} Fotos). In den geteilten iCloud-Ordner legen und „Ersetzen“ wählen.`);}catch(e){toast(e.message);}finally{busy=false;render();}}
async function load(file){if(busy)return;busy=true;try{
  if(file.size>300*1024*1024)throw Error('Datei zu groß.');let data;try{data=JSON.parse(await file.text());}catch{throw Error('Datei ist beschädigt oder keine JSON-Datei.');}
  const p=await TravelStore.sync.plan(data),n=p.n;
  if(!p.anything){TravelStore.sync.status();toast('Alles schon auf dem gleichen Stand – nichts zu übernehmen.');localMark();return;}
  const pl=(k,one,many)=>k===1?one:many;const lines=[n.tripNew&&`${n.tripNew} ${pl(n.tripNew,'neue Station','neue Stationen')}`,n.tripUpd&&`${n.tripUpd} ${pl(n.tripUpd,'Änderung','Änderungen')} an Route oder Einstellungen`,n.tripDel&&`${n.tripDel} ${pl(n.tripDel,'gelöschte Station','gelöschte Stationen')}`,n.diaryNew&&`${n.diaryNew} ${pl(n.diaryNew,'neuer Tagebucheintrag','neue Tagebucheinträge')}`,n.diaryUpd&&`${n.diaryUpd} ${pl(n.diaryUpd,'geänderter Tagebucheintrag','geänderte Tagebucheinträge')}`,n.diaryDel&&`${n.diaryDel} ${pl(n.diaryDel,'gelöschter Tagebucheintrag','gelöschte Tagebucheinträge')}`].filter(Boolean);
  const ok=await confirmAction('Abgleich übernehmen?',`Datei vom ${when(p.exportedAt)}. Übernommen wird: ${lines.join(', ')}. Bei Änderungen am selben Eintrag gewinnt jeweils die neuere. Vorher wird automatisch eine Sicherheitskopie angelegt.`,[{label:'Abbrechen',value:false},{label:'Abgleichen',value:true,className:'primary'}]);
  if(!ok)return;toast('Abgleich läuft …');const r=await TravelStore.sync.apply(p);
  try{state=TravelCore.validateState(r.state);render_();}catch{}
  window.TravelDiary?.reload?.();toast('Abgleich abgeschlossen.'+(r.backup?' Vorheriger Stand gesichert.':''));
}catch(e){toast('Abgleich fehlgeschlagen: '+e.message);}finally{busy=false;render();}}
function localMark(){try{const k='reiseatelier.web.syncstatus.v1',s=JSON.parse(localStorage.getItem(k)||'{}');s.loaded=new Date().toISOString();localStorage.setItem(k,JSON.stringify(s));}catch{}}
function render_(){try{window.__renderTrip?.();}catch{}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-sync]');if(!b)return;if(b.dataset.sync==='save')save();if(b.dataset.sync==='load')q('#sync-file').click();});
document.addEventListener('change',e=>{if(e.target.id!=='sync-file')return;const f=e.target.files[0];e.target.value='';if(f)load(f);});
window.TravelSync={render};
setInterval(render,60000);
})();

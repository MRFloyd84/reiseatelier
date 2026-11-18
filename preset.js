'use strict';
/* Vorlage: AIDAdiva Weltreise 2027/2028 – Reiseverlauf laut Reiseveranstalter-Angaben (Stand Nov. 2026), ohne Gewähr. */
(function(root){
// [Name, Land, Stadt/Hafen, Art, Start, Ende, An, Ab, Breite, Länge]
const R=[
['Hamburg','DE','Hamburg','hafen','2027-10-24','2027-10-24','','20:00',53.5433,9.9667],
['Portland (Dorset)','GB','Isle of Portland','hafen','2027-10-26','2027-10-26','08:00','18:00',50.5680,-2.4370],
['Halifax','CA','Halifax','hafen','2027-11-02','2027-11-02','08:00','22:00',44.6400,-63.5680],
['Boston','US','Boston','hafen','2027-11-04','2027-11-05','09:00','17:00',42.3480,-71.0330],
['New York','US','New York','hafen','2027-11-06','2027-11-07','18:00','22:00',40.7700,-74.0000],
['Port Canaveral (Orlando)','US','Port Canaveral','hafen','2027-11-10','2027-11-10','08:00','18:00',28.4100,-80.6200],
['Miami','US','Miami','hafen','2027-11-11','2027-11-11','08:00','18:00',25.7780,-80.1700],
['Cozumel','MX','Cozumel','hafen','2027-11-13','2027-11-13','06:00','20:00',20.5000,-86.9500],
['Belize City','BZ','Belize City','hafen','2027-11-14','2027-11-14','10:00','19:00',17.4900,-88.1800],
['Mahogany Bay (Roatán)','HN','Roatán','hafen','2027-11-15','2027-11-15','06:00','18:00',16.3700,-86.4500],
['Puerto Limón','CR','Puerto Limón','hafen','2027-11-17','2027-11-17','08:00','17:00',9.9900,-83.0300],
['Panamakanal (Passage)','PA','Panamakanal','zwischenstopp','2027-11-18','2027-11-18','14:00','20:00',9.1200,-79.7700],
['Panama-Stadt','PA','Panama-Stadt','hafen','2027-11-18','2027-11-19','22:00','18:00',8.9100,-79.5300],
['Puntarenas','CR','Puntarenas','hafen','2027-11-21','2027-11-21','08:00','18:00',9.9760,-84.8350],
['Puerto Quetzal','GT','Puerto Quetzal','hafen','2027-11-23','2027-11-23','08:00','18:00',13.9200,-90.7800],
['Puerto Vallarta','MX','Puerto Vallarta','hafen','2027-11-26','2027-11-26','08:00','15:00',20.6530,-105.2400],
['San Diego','US','San Diego','hafen','2027-11-29','2027-11-29','08:00','20:00',32.7150,-117.1750],
['Los Angeles','US','Los Angeles (San Pedro)','hafen','2027-11-30','2027-11-30','08:00','22:00',33.7400,-118.2800],
['Santa Barbara','US','Santa Barbara','hafen','2027-12-01','2027-12-01','07:00','17:00',34.4100,-119.6900],
['San Francisco','US','San Francisco','hafen','2027-12-02','2027-12-04','14:30','14:00',37.8000,-122.4000],
['Honolulu (Oʻahu)','US','Honolulu','hafen','2027-12-09','2027-12-10','19:00','20:00',21.3070,-157.8660],
['Kahului (Maui)','US','Kahului','hafen','2027-12-11','2027-12-11','08:00','19:30',20.8950,-156.4700],
['Hilo (Hawaiʻi)','US','Hilo','hafen','2027-12-12','2027-12-12','07:00','19:30',19.7300,-155.0600],
['Kailua-Kona (Hawaiʻi)','US','Kailua-Kona','hafen','2027-12-13','2027-12-13','07:00','17:00',19.6400,-155.9970],
['Moorea','PF','Moorea','hafen','2027-12-19','2027-12-19','08:00','18:00',-17.4900,-149.8200],
['Papeete (Tahiti)','PF','Papeete','hafen','2027-12-19','2027-12-20','21:30','18:00',-17.5350,-149.5700],
['Aitutaki','CK','Aitutaki','hafen','2027-12-22','2027-12-22','08:00','17:00',-18.8600,-159.7900],
['Nouméa','NC','Nouméa','hafen','2027-12-28','2027-12-28','09:00','17:00',-22.2700,166.4400],
['Sydney','AU','Sydney','hafen','2027-12-31','2028-01-01','09:30','20:00',-33.8580,151.2100],
['Brisbane','AU','Brisbane','hafen','2028-01-03','2028-01-03','08:00','18:00',-27.4500,153.0700],
['Airlie Beach','AU','Airlie Beach','hafen','2028-01-05','2028-01-05','08:00','18:00',-20.2680,148.7200],
['Townsville','AU','Townsville','hafen','2028-01-06','2028-01-06','08:00','18:00',-19.2550,146.8200],
['Cairns','AU','Cairns','hafen','2028-01-07','2028-01-07','08:00','18:00',-16.9200,145.7800],
['Darwin','AU','Darwin','hafen','2028-01-11','2028-01-12','08:00','18:00',-12.4700,130.8450],
['Lembar (Lombok)','ID','Lembar','hafen','2028-01-15','2028-01-15','08:00','18:00',-8.7300,116.0700],
['Bali (Benoa)','ID','Benoa','hafen','2028-01-16','2028-01-16','07:00','18:00',-8.7450,115.2100],
['Singapur','SG','Singapur','hafen','2028-01-19','2028-01-20','11:00','18:00',1.2650,103.8200],
['Port Klang (Kuala Lumpur)','MY','Port Klang','hafen','2028-01-21','2028-01-21','09:00','18:30',3.0000,101.3900],
['Penang','MY','George Town','hafen','2028-01-22','2028-01-22','08:30','16:30',5.4180,100.3450],
['Hambantota','LK','Hambantota','hafen','2028-01-25','2028-01-25','10:00','20:00',6.1200,81.1100],
['Colombo','LK','Colombo','hafen','2028-01-26','2028-01-26','08:00','20:00',6.9500,79.8450],
['Malé','MV','Malé','hafen','2028-01-28','2028-01-28','08:00','18:00',4.1750,73.5100],
['Victoria (Mahé)','SC','Victoria','hafen','2028-02-01','2028-02-01','08:00','19:00',-4.6200,55.4550],
['Port Louis','MU','Port Louis','hafen','2028-02-04','2028-02-04','08:00','18:00',-20.1600,57.4950],
['Le Port (La Réunion)','RE','Le Port','hafen','2028-02-05','2028-02-05','08:00','18:00',-20.9300,55.2900],
['Gqeberha (Port Elizabeth)','ZA','Gqeberha','hafen','2028-02-10','2028-02-11','06:00','23:00',-33.9650,25.6300],
['Kapstadt','ZA','Kapstadt','hafen','2028-02-13','2028-02-13','06:00','23:30',-33.9100,18.4300],
['Santos (São Paulo)','BR','Santos','hafen','2028-02-22','2028-02-23','08:00','18:00',-23.9800,-46.3000],
['Angra dos Reis','BR','Angra dos Reis','hafen','2028-02-24','2028-02-24','08:00','18:00',-23.0100,-44.3200],
['Armação dos Búzios','BR','Búzios','hafen','2028-02-25','2028-02-25','08:00','18:00',-22.7500,-41.8800],
['Rio de Janeiro','BR','Rio de Janeiro','hafen','2028-02-26','2028-02-28','08:00','07:00',-22.8950,-43.1800],
['Salvador da Bahia','BR','Salvador','hafen','2028-03-01','2028-03-01','07:00','16:00',-12.9700,-38.5150],
['Praia (Santiago)','CV','Praia','hafen','2028-03-06','2028-03-06','11:00','20:00',14.9150,-23.5050],
['Santa Cruz de Tenerife','ES','Santa Cruz de Tenerife','hafen','2028-03-09','2028-03-09','08:00','19:00',28.4700,-16.2450],
['Funchal (Madeira)','PT','Funchal','hafen','2028-03-10','2028-03-10','12:00','20:00',32.6430,-16.9150],
['Lissabon','PT','Lissabon','hafen','2028-03-12','2028-03-12','08:00','16:00',38.7050,-9.1450],
['Hamburg (Ankunft)','DE','Hamburg','hafen','2028-03-16','2028-03-16','08:00','',53.5433,9.9667],
];
function worldTrip(){
  return {version:1,settings:{title:'Weltreise 2027/2028',description:'Mit der AIDAdiva ab/bis Hamburg · 24.10.2027 – 16.03.2028 · 144 Tage, 6 Kontinente. Termine und Zeiten laut Reiseverlauf, Änderungen durch die Reederei möglich.'},routeMode:'date',
    destinations:R.map(([name,country,city,kind,start,end,arrival,departure,lat,lng],i)=>({id:'aidadiva-wr27-'+String(i+1).padStart(2,'0'),name,country,city,kind,start,end,arrival,departure,status:'offen',info:'',plan:'',lat,lng}))};
}

/* ---------- Countdown ---------- */
const DAY=86400000;
function at(date,time){return new Date(date+'T'+(time||'00:00')+':00');}
function countdown(state){
  const ds=(state&&state.destinations||[]).filter(d=>d.start);if(!ds.length)return null;
  const first=ds.reduce((a,b)=>at(b.start,b.departure||b.arrival)<at(a.start,a.departure||a.arrival)?b:a);
  const last=ds.reduce((a,b)=>at(b.end||b.start,b.departure||b.arrival)>at(a.end||a.start,a.departure||a.arrival)?b:a);
  const begin=at(first.start,first.departure||first.arrival),end=at(last.end||last.start,last.arrival||last.departure||'23:59'),now=new Date();
  const totalDays=Math.round((at(last.end||last.start)-at(first.start))/DAY)+1;
  if(now<begin){const ms=begin-now,d=Math.floor(ms/DAY),h=Math.floor(ms%DAY/3600000),m=Math.floor(ms%3600000/60000);
    return {phase:'before',d,h,m,label:'bis zur Abfahrt in '+(first.city||first.name),when:begin};}
  if(now<=end){const day=Math.floor((new Date(now.toDateString())-at(first.start))/DAY)+1;
    const here=ds.find(d=>{const s=at(d.start),e=at(d.end||d.start);return now>=s&&now<new Date(+e+DAY);});
    return {phase:'during',day,totalDays,here};}
  return {phase:'after',when:end};
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderCountdown(state){
  const el=document.getElementById('countdown');if(!el)return;const c=countdown(state);
  if(!c){el.hidden=true;return;}el.hidden=false;
  const fmt=d=>d.toLocaleString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  if(c.phase==='before')el.innerHTML=`<div class="cd-units"><span><b>${c.d}</b>Tage</span><span><b>${c.h}</b>Std.</span><span><b>${c.m}</b>Min.</span></div><p>${esc(c.label)} · ${esc(fmt(c.when))} Uhr</p>`;
  else if(c.phase==='during')el.innerHTML=`<div class="cd-units"><span><b>${c.day}</b>Reisetag</span><span><b>${c.totalDays}</b>Tage gesamt</span></div><p>${c.here?'Heute: '+esc(c.here.name)+(root.TravelCore&&root.TravelCore.aboard(c.here)&&(c.here.end||c.here.start)===new Date().toLocaleDateString('sv-SE')?' · <strong>'+esc(root.TravelCore.aboardLabel(c.here))+'</strong>':''):'Heute auf See'}</p>`;
  else el.innerHTML=`<p class="cd-done">Reise beendet am ${esc(fmt(c.when))} Uhr – willkommen zurück!</p>`;
}
root.TravelPreset={worldTrip,countdown,renderCountdown,count:R.length};
})(globalThis);

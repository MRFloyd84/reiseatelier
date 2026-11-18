'use strict';
/* Notfallnummern für die Länder der Route.
   Quellen: Auswärtiges Amt (auswaertiges-amt.de, Seiten „Deutsche Vertretungen in …“, abgerufen 18.11.2026),
   germany.info / diplo.de, sperr-notruf.de, aida.de; örtliche Notrufe: Wikipedia „List of emergency telephone numbers“,
   ERGO-Übersicht und Reisehinweise des Auswärtigen Amts. Stand: 18.11.2026 – vor der Reise bitte erneut prüfen. */
(function(root){
const CHECKED='18.11.2026';
// Zentrale Nummern (aus dem Ausland erreichbar)
const CENTRAL=[
  {label:'Auswärtiges Amt – Notfälle rund um die Uhr',phone:'+49 30 5000 0',note:'Telefonzentrale in Berlin, nachts und am Wochenende für Notfälle im Ausland.'},
  {label:'Sperr-Notruf für Bank- und Kreditkarten',phone:'+49 116 116',alt:'+49 30 4050 4050',note:'Falls 116 116 aus dem Ausland nicht klappt, die Berliner Ersatznummer wählen.'},
  {label:'Giftnotruf Berlin (24 h)',phone:'+49 30 19240'},
  {label:'AIDA Service (24 h)',phone:'+49 381 20 27 07 22',note:'Für Fragen rund um die Reise. An Bord: Rezeption bzw. Hospital auf Deck 3.'},
];
// Für Angehörige zu Hause
const HOME=[
  {label:'AIDAdiva aus dem deutschen Festnetz',phone:'09001 18 22 22 04',note:'Kostenpflichtige Sondernummer (laut AIDA-Bordinformationen 2024, 1,89 €/Min.), nur aus dem deutschen Festnetz. Durchwahl zur Kabine laut aktueller AIDA-Bordinformation.'},
];
// Pro Land: örtlicher Notruf und zuständige deutsche Vertretungen. ports = Städte/Häfen der Route, für die die Vertretung gilt.
const C=[
 {cc:'DE',sos:'112',sosText:'Notruf 112 · Polizei 110',missions:[]},
 {cc:'GB',sos:'999',sosText:'Notruf 999 oder 112',missions:[{name:'Deutsche Botschaft London',phone:'+44 20 7824 1300',emergency:'+44 7956 626107'}]},
 {cc:'CA',sos:'911',sosText:'Notruf 911',missions:[{name:'Generalkonsulat Toronto (zuständig für ganz Kanada)',phone:'+1 416 925 2813',emergency:'+1 416 953 3817'},{name:'Honorarkonsulin Halifax',phone:'+1 902 420 1599',ports:['Halifax'],note:'Nur nach Terminvereinbarung, für Notfälle Generalkonsulat Toronto.'}]},
 {cc:'US',sos:'911',sosText:'Notruf 911',missions:[
   {name:'Generalkonsulat Boston',phone:'+1 617 369 4900',emergency:'+1 202 298 4000',ports:['Boston']},
   {name:'Generalkonsulat New York',phone:'+1 212 610 9700',emergency:'+1 202 298 4000',ports:['New York']},
   {name:'Generalkonsulat Miami (Florida)',phone:'+1 305 358 0290',emergency:'+1 202 298 4000',ports:['Miami','Port Canaveral']},
   {name:'Generalkonsulat Los Angeles (Südkalifornien)',phone:'+1 323 930 2703',emergency:'+1 202 298 4000',ports:['Los Angeles','San Diego','Santa Barbara']},
   {name:'Generalkonsulat San Francisco (Nordkalifornien, Hawaii)',phone:'+1 415 775 1061',emergency:'+1 202 298 4000',ports:['San Francisco','Honolulu','Kahului','Hilo','Kailua-Kona']},
   {name:'Honorarkonsul Honolulu (Hawaii)',phone:'+1 808 377 4606',ports:['Honolulu','Kahului','Hilo','Kailua-Kona']}],
   note:'Die Notfallnummer +1 202 298 4000 ist der zentrale Bereitschaftsdienst aller deutschen Vertretungen in den USA.'},
 {cc:'MX',sos:'911',sosText:'Notruf 911 (auch Englisch)',missions:[{name:'Deutsche Botschaft Mexiko-Stadt',phone:'+52 55 5283 2200',emergency:'+52 55 5431 2177'},{name:'Honorarkonsulin Cancún (Quintana Roo, auch Cozumel)',phone:'+52 998 884 1598',ports:['Cozumel']}]},
 {cc:'BZ',sos:'911',sosText:'Notruf 911',missions:[{name:'Honorarkonsulin Belize City',phone:'+501 223 0896',ports:['Belize City']},{name:'Deutsche Botschaft Guatemala (zuständig für Belize)',phone:'+502 2364 6700',emergency:'+502 5709 5004'}]},
 {cc:'HN',sos:'911',sosText:'Notruf 911 · Rettung 195 · Feuerwehr 198',missions:[{name:'Honorarkonsul San Pedro Sula (zuständig für die Bay Islands/Roatán)',phone:'+504 2550 2002',ports:['Roatán']},{name:'Deutsche Botschaft Tegucigalpa',phone:'+504 2275 9292',emergency:'+504 9990 2437'}]},
 {cc:'CR',sos:'911',sosText:'Notruf 911 (Handy auch 112)',missions:[{name:'Deutsche Botschaft San José',phone:'+506 2290 9091',emergency:'+506 8381 7968'}]},
 {cc:'PA',sos:'911',sosText:'Notruf 911 · Polizei 104 · Feuerwehr 103',missions:[{name:'Deutsche Botschaft Panama-Stadt',phone:'+507 307 6300',emergency:'+507 6517 3200',note:'Bereitschaftsdienst bis 24 Uhr Ortszeit, auch per SMS/WhatsApp.'}]},
 {cc:'GT',sos:'110',sosText:'Polizei 110 · Feuerwehr 122 · Rotes Kreuz 125',missions:[{name:'Deutsche Botschaft Guatemala-Stadt',phone:'+502 2364 6700',emergency:'+502 5709 5004',note:'Notfallnummer auch per SMS.'}]},
 {cc:'PF',sos:'112',sosText:'Notruf 112 · Polizei 17 · SAMU 15 · Feuerwehr 18',missions:[{name:'Deutsche Botschaft Paris (zuständig)',phone:'+33 1 53 83 45 00',emergency:'+33 6 11 76 22 55'},{name:'Deutsche Botschaft Wellington (Passangelegenheiten)',phone:'+64 4 473 6063',emergency:'+64 21 651 987'}]},
 {cc:'CK',sos:'999',sosText:'Notruf 999',missions:[{name:'Deutsche Botschaft Wellington (zuständig)',phone:'+64 4 473 6063',emergency:'+64 21 651 987',note:'Notfallnummer auch per SMS.'}]},
 {cc:'NC',sos:'112',sosText:'Notruf 112 · Polizei 17 · SAMU 15 · Feuerwehr 18',missions:[{name:'Deutsche Botschaft Paris (zuständig)',phone:'+33 1 53 83 45 00',emergency:'+33 6 11 76 22 55'}]},
 {cc:'AU',sos:'000',sosText:'Notruf 000 (Handy auch 112)',missions:[{name:'Generalkonsulat Sydney (u. a. NSW, Queensland, Northern Territory)',phone:'+61 2 8302 4900',emergency:'+61 412 359 826',note:'Australienweite Rufbereitschaft, auch per SMS.'}]},
 {cc:'ID',sos:'112',sosText:'Notruf 112 · Polizei 110 · Rettung 118/119',missions:[{name:'Honorarkonsul Bali (Sanur, zuständig für Bali und Lombok)',phone:'+62 361 288 535',ports:['Benoa','Lembar']},{name:'Deutsche Botschaft Jakarta',phone:'+62 21 3985 5000',emergency:'+62 811 152 526'}]},
 {cc:'SG',sos:'999',sosText:'Polizei 999 · Rettung/Feuerwehr 995',missions:[{name:'Deutsche Botschaft Singapur',phone:'+65 6533 6002',emergency:'+65 9817 0414',note:'Notfallnummer werktags nach Dienstschluss bis 24 Uhr, am Wochenende tagsüber.'}]},
 {cc:'MY',sos:'999',sosText:'Notruf 999 (Handy auch 112)',missions:[{name:'Honorarkonsul Penang',phone:'+60 4 263 2566',ports:['George Town']},{name:'Deutsche Botschaft Kuala Lumpur',phone:'+60 3 2170 9666',emergency:'+60 12 326 9070',note:'Bereitschaft bis 24 Uhr, am Wochenende 8–24 Uhr.'}]},
 {cc:'LK',sos:'119',sosText:'Polizei 119 · Feuerwehr/Rettung 110',missions:[{name:'Deutsche Botschaft Colombo',phone:'+94 11 258 0431',emergency:'+94 77 734 4283',note:'Notfallnummer Mo–Fr 15:30–22 Uhr, Wochenende 8–22 Uhr.'}]},
 {cc:'MV',sos:'119',sosText:'Polizei 119 · Feuerwehr 118',missions:[{name:'Honorarkonsul Malé',phone:'+960 334 9595'},{name:'Deutsche Botschaft Colombo (zuständig)',phone:'+94 11 258 0431',emergency:'+94 77 734 4283'}]},
 {cc:'SC',sos:'999',sosText:'Notruf 999 oder 112',missions:[{name:'Honorarkonsulin Victoria (Mahé)',phone:'+248 4601 100',emergency:'+248 2718 350'},{name:'Deutsche Botschaft Nairobi (zuständig)',emergency:'+254 721 322 443',note:'Notfallnummer auch per SMS/WhatsApp.'}]},
 {cc:'MU',sos:'999',sosText:'Polizei 999 oder 112 · SAMU 114 · Feuerwehr 115',missions:[{name:'Honorarkonsul Ébène',phone:'+230 5253 0300'},{name:'Deutsche Botschaft Antananarivo (zuständig)',phone:'+261 20 222 3802',emergency:'+261 37 03 457 39'}]},
 {cc:'RE',sos:'112',sosText:'Notruf 112 · Polizei 17 · SAMU 15 · Feuerwehr 18',missions:[{name:'Deutsche Botschaft Paris (zuständig)',phone:'+33 1 53 83 45 00',emergency:'+33 6 11 76 22 55'}]},
 {cc:'ZA',sos:'10111',sosText:'Polizei 10111 · Rettung 10177 · Handy 112',missions:[{name:'Generalkonsulat Kapstadt (West- und Ostkap)',phone:'+27 21 405 3000'},{name:'Deutsche Botschaft Pretoria',phone:'+27 12 427 8900'}],note:'Eine eigene Bereitschaftsnummer war nicht angegeben – außerhalb der Dienstzeit das Auswärtige Amt anrufen (+49 30 5000 0).'},
 {cc:'BR',sos:'190',sosText:'Polizei 190 · Rettung (SAMU) 192 · Feuerwehr 193',missions:[
   {name:'Generalkonsulat São Paulo (auch Santos)',phone:'+55 11 3097 6644',emergency:'+55 61 3442 7000',ports:['Santos']},
   {name:'Generalkonsulat Rio de Janeiro (auch Angra dos Reis, Búzios)',phone:'+55 21 3380 3700',emergency:'+55 61 3442 7000',ports:['Rio de Janeiro','Angra dos Reis','Búzios']},
   {name:'Generalkonsulat Recife (zuständig für Bahia/Salvador)',phone:'+55 81 3463 5350',emergency:'+55 61 3442 7000',ports:['Salvador']}],
   note:'+55 61 3442 7000 ist die Bereitschaftsnummer der deutschen Vertretungen in Brasilien.'},
 {cc:'CV',sos:'132',sosText:'Polizei 132 · Rettung 130 · Feuerwehr 131',missions:[{name:'Honorarkonsul Mindelo',phone:'+238 231 2725'},{name:'Deutsche Botschaft Lissabon (zuständig)',phone:'+351 21 881 0210',emergency:'+351 96 580 8092'}],note:'Bei Passverlust stellt die Botschaft Portugals in Praia ein EU-Notreisedokument aus.'},
 {cc:'ES',sos:'112',sosText:'Notruf 112',missions:[{name:'Honorarkonsul Teneriffa (Puerto de la Cruz)',phone:'+34 922 248 820'},{name:'Deutsches Konsulat Las Palmas (Kanaren)',phone:'+34 928 491 880',emergency:'+34 91 557 9000'}]},
 {cc:'PT',sos:'112',sosText:'Notruf 112',missions:[{name:'Deutsche Botschaft Lissabon (auch Madeira)',phone:'+351 21 881 0210',emergency:'+351 96 580 8092',note:'Bereitschaft werktags abends bis 24 Uhr, am Wochenende 8–24 Uhr.'}]},
];
root.EmergencyData={CHECKED,CENTRAL,HOME,COUNTRIES:C,byCC:Object.fromEntries(C.map(c=>[c.cc,c]))};
})(globalThis);

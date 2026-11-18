'use strict';
/* Einreise-Checkliste für deutsche Staatsangehörige (Reisepass) auf der AIDAdiva-Weltreise.
   Recherchiert am 18.11.2026: gov.uk / uk.diplo.de (UK ETA), CBP/esta.cbp.dhs.gov (ESTA), IRCC (Kanada: kein eTA per Schiff),
   Australian Home Affairs (eVisitor 651), Sri Lanka Immigration (kostenlose ETA seit 25.05.2026), Seychelles Immigration (Travel
   Authorisation auch für Kreuzfahrtgäste seit 01.12.2024), ICA Singapore (SGAC), Imigresen Malaysia (MDAC), Maldives Immigration
   (IMUGA), Indonesien (e-VOA, kein VoA am Hafen Benoa; Bali-Abgabe), EASE Kap Verde, mexikanische Konsulate (Kreuzfahrt ohne Visum),
   Auswärtiges Amt / südafrikanische Vertretung (2 freie Passseiten), WHO-Vorschriften Gelbfieber (Kap Verde).
   open = frühestens so viele Tage vor Ankunft, due = spätestens so viele Tage vor Ankunft (bei general: vor Reisebeginn). */
(function(root){
const CHECKED='18.11.2026';
const GENERAL=[
 {id:'pass',title:'Reisepass prüfen',detail:'Der Pass sollte bis mindestens Ende September 2028 gültig sein (viele Länder verlangen 6 Monate Restgültigkeit, das letzte davon ist Brasilien im März 2028) und mehrere freie Seiten haben – Südafrika verlangt mindestens 2 leere Seiten. Neuer Pass nötig? Dann zuerst den Pass beantragen: ESTA, UK-ETA und eVisitor gelten nur für den Pass, mit dem sie beantragt wurden.',due:240},
 {id:'aida',title:'AIDA-Reiseunterlagen zu Visa lesen',detail:'AIDA schickt vor der Weltreise eine Übersicht, welche Genehmigungen ihr selbst beantragen müsst und was AIDA für das Schiff erledigt (z. B. Sammelvisa, Einreisekarten). Diese Angaben gehen vor – bei Abweichungen gilt AIDA.',due:60},
 {id:'versicherung',title:'Auslandskrankenversicherung für 145 Tage',detail:'Viele Jahresverträge decken nur 6–8 Wochen am Stück. Prüft, ob die gesamte Reisedauer (24.10.2027–16.03.2028) inklusive Rücktransport abgedeckt ist, sonst eine Langzeit-Police abschließen. Nummer und Versicherungsnummer im Tab „Notfall“ eintragen.',due:45},
 {id:'gelbfieber',title:'Reisemedizinische Beratung (Gelbfieber)',detail:'Kap Verde verlangt bei Einreise aus Ländern mit Gelbfieber-Risiko einen Impfnachweis – die Route kommt direkt aus Brasilien. Die Impfung muss mindestens 10 Tage vor der Einreise erfolgen und gilt lebenslang. Gelben Impfpass mitnehmen. Ob AIDA den Nachweis für den Landgang verlangt, steht in den Reiseunterlagen.',due:42},
 {id:'elefand',title:'Krisenvorsorgeliste „Elefand“',detail:'Beim Auswärtigen Amt kostenlos eintragen, damit die Botschaften euch im Krisenfall erreichen. Dazu die App „Sicher Reisen“.',due:14,link:'https://krisenvorsorgeliste.diplo.de'},
];
const T=[
 {id:'uk-eta',cc:'GB',title:'UK ETA beantragen',detail:'Elektronische Einreisegenehmigung für Großbritannien – auch für Landgänge von Kreuzfahrtgästen. Gilt 2 Jahre bzw. bis zum Ablauf des Passes. Antrag über die App „UK ETA“ oder online, Entscheidung meist innerhalb von 3 Werktagen.',cost:'20 £ pro Person',link:'https://www.gov.uk/eta',open:700,due:14},
 {id:'esta',cc:'US',title:'ESTA beantragen',detail:'Pflicht für die Einreise per Schiff in die USA (Boston, New York, Florida, Kalifornien, Hawaii). Gilt 2 Jahre bzw. bis zum Ablauf des Passes. Nur auf der offiziellen Seite beantragen – andere Seiten verlangen Aufschläge. Wer seit 2021 in Kuba war, bekommt kein ESTA, sondern braucht ein Visum.',cost:'40,62 $ pro Person',link:'https://esta.cbp.dhs.gov',open:700,due:21},
 {id:'evisitor',cc:'AU',title:'Australien: eVisitor (Subclass 651)',detail:'Kostenloses elektronisches Visum für EU-Bürger, über ein ImmiAccount beantragen. Gilt 12 Monate ab Erteilung – also erst ab etwa Februar 2027 beantragen, damit es bis zur Abreise aus Darwin (11.01.2028) reicht. An Bord kommt zusätzlich die Einreisekarte (Incoming Passenger Card).',cost:'kostenlos',link:'https://immi.homeaffairs.gov.au',open:330,due:30},
 {id:'id-evoa',cc:'ID',title:'Indonesien: e-VOA (Visum)',detail:'Deutsche brauchen ein Visum. Am Kreuzfahrthafen Benoa (Bali) gibt es kein Visum bei Ankunft – das e-VOA muss vorher online beantragt werden. Erst wenige Wochen vor Ankunft beantragen. Viele Reedereien organisieren das Visum für das Schiff – zuerst in den AIDA-Unterlagen nachsehen.',cost:'kostenpflichtig',link:'https://evisa.imigrasi.go.id',open:60,due:5},
 {id:'id-card',cc:'ID',title:'Indonesien: Einreisekarte „All Indonesia“',detail:'Digitale Einreise- und Zollerklärung, innerhalb von 3 Tagen vor Ankunft (Lembar/Lombok) ausfüllen. Falls AIDA das für das Schiff erledigt, entfällt es.',cost:'kostenlos',open:3,due:0},
 {id:'bali-levy',cc:'ID',title:'Bali: Tourismusabgabe',detail:'Abgabe für ausländische Besucher auf Bali (Benoa, 16.01.2028), online über die offizielle Seite „Love Bali“ oder vor Ort zahlbar.',cost:'150.000 IDR (ca. 9 €)',link:'https://lovebali.baliprov.go.id',open:30,due:0,place:'Benoa'},
 {id:'sgac',cc:'SG',title:'Singapur: SG Arrival Card',detail:'Kostenlose Einreisekarte mit Gesundheitserklärung, innerhalb von 3 Tagen vor Ankunft ausfüllen – auch bei Ankunft per Schiff. Nur über die offizielle ICA-Seite oder die App „MyICA“.',cost:'kostenlos',link:'https://eservices.ica.gov.sg/sgarrivalcard',open:3,due:0},
 {id:'mdac',cc:'MY',title:'Malaysia: Digital Arrival Card (MDAC)',detail:'Kostenlose digitale Einreisekarte, innerhalb von 3 Tagen vor Ankunft (Port Klang). Falls AIDA sie für das Schiff erledigt, entfällt sie.',cost:'kostenlos',link:'https://imigresen-online.imi.gov.my/mdac/main',open:3,due:0},
 {id:'lk-eta',cc:'LK',title:'Sri Lanka: ETA beantragen',detail:'Für Deutsche seit 25.05.2026 kostenlos, muss aber vorher beantragt werden. Frühestens 90 Tage vor Ankunft möglich – das ist erst nach Reisebeginn, also unterwegs an Bord. Bei bis zu 2 Tagen im Land reicht ggf. die Transit-ETA; welche Art, steht in den AIDA-Unterlagen. Bestätigung ausdrucken bzw. an der Rezeption abgeben, wenn AIDA das verlangt.',cost:'kostenlos',link:'https://eta.gov.lk/slvisa/',open:90,due:7},
 {id:'imuga',cc:'MV',title:'Malediven: IMUGA Traveller Declaration',detail:'Pflichtformular für jede Einreise, innerhalb von 96 Stunden vor Ankunft. Das Visum selbst gibt es kostenlos bei Ankunft.',cost:'kostenlos',link:'https://imuga.immigration.gov.mv/traveller',open:4,due:0},
 {id:'sc-ta',cc:'SC',title:'Seychellen: Travel Authorisation',detail:'Seit Dezember 2024 auch für Kreuzfahrtgäste Pflicht. Frühestens 30 Tage vor Ankunft, spätestens im letzten Hafen davor. Nur über die offizielle Regierungsseite beantragen.',cost:'ca. 12 € pro Person',link:'https://seychelles.govtas.com',open:30,due:1},
 {id:'cv-ease',cc:'CV',title:'Kap Verde: EASE-Vorregistrierung',detail:'Kap Verde verlangt eine Online-Vorregistrierung, ggf. mit Sicherheitsgebühr, spätestens 5 Tage vor Ankunft. Ob das für Kreuzfahrtgäste mit Landgang nötig ist oder AIDA es übernimmt, steht in den AIDA-Unterlagen.',cost:'je nach Fall',link:'https://www.ease.gov.cv',open:30,due:5},
];
// Länder ohne eigene Formalitäten (Reisepass genügt)
const FREE={
 DE:'Heimathafen.',CA:'Kein eTA nötig – das gilt nur bei Ankunft per Flugzeug, nicht per Kreuzfahrtschiff.',
 MX:'Kein Visum: Kreuzfahrtgäste erhalten eine Sammelerlaubnis. Die mexikanische Passagiergebühr rechnet die Reederei ab.',
 BZ:'Kein Visum.',HN:'Kein Visum.',CR:'Kein Visum.',PA:'Kein Visum.',GT:'Kein Visum.',
 PF:'Französisches Überseegebiet – kein Visum.',NC:'Französisches Überseegebiet – kein Visum.',RE:'Französisches Überseedepartement (EU) – kein Visum.',
 CK:'Kein Visum (bis 31 Tage).',MU:'Kein Visum.',ZA:'Kein Visum. Pass muss 2 leere Seiten haben und 30 Tage über die Ausreise hinaus gültig sein.',
 BR:'Kein Visum (bis 90 Tage).',ES:'EU – kein Visum.',PT:'EU – kein Visum.'};
root.EntryData={CHECKED,GENERAL,TASKS:T,FREE};
})(globalThis);

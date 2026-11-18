# Reiseatelier – eigenständige Web-App

Diese Version braucht **kein Claude-Konto** und keinen eigenen Server mit Datenbank. Es sind reine Dateien (HTML, CSS, JavaScript), die auf jedem Webspace mit HTTPS laufen. Die Daten liegen auf dem jeweiligen Gerät, abgeglichen wird über eine Datei in einem geteilten iCloud-Drive-Ordner.

## 1. Online stellen (einmalig, ca. 10 Minuten)

HTTPS ist Pflicht, sonst funktionieren Home-Bildschirm-App und Offline-Modus nicht. Alle drei Wege sind kostenlos.

### Variante A: GitHub Pages
1. Auf github.com ein neues **öffentliches** Repository anlegen, z. B. `reiseatelier`.
2. „Add file → Upload files“ und **den Inhalt dieses Ordners** hochladen (nicht den Ordner selbst, `index.html` muss oben liegen).
3. Settings → Pages → „Deploy from a branch“ → Branch `main`, Ordner `/ (root)` → Save.
4. Nach 1–2 Minuten ist die Seite unter `https://DEINNAME.github.io/reiseatelier/` erreichbar.

Hinweis: Der Quellcode ist bei einem öffentlichen Repository einsehbar. Die Reisedaten liegen nur auf den Geräten und sind nicht Teil der Seite.

### Variante B: Netlify
1. Kostenloses Konto auf netlify.com anlegen.
2. „Add new site → Deploy manually“ und diesen Ordner ins Fenster ziehen.
3. Unter „Site configuration → Change site name“ einen Namen wählen, z. B. `reiseatelier-weltreise`.

### Variante C: Raspberry Pi
Den Ordner mit einem beliebigen Webserver ausliefern (z. B. `python3 -m http.server`, nginx oder Caddy). Für HTTPS von außen eignet sich ein Cloudflare Tunnel oder Tailscale Funnel. Der Pi muss nur erreichbar sein, wenn die App neu installiert oder aktualisiert wird. Danach läuft sie aus dem Gerätespeicher.

## 2. Auf iPhone und iPad installieren (wichtig!)

1. Den Link in **Safari** öffnen.
2. Teilen-Symbol → **„Zum Home-Bildschirm“** → Hinzufügen.
3. Ab dann **nur noch das Symbol auf dem Home-Bildschirm** benutzen.

Warum: Safari löscht gespeicherte Daten von Webseiten, die eine Woche lang nicht geöffnet wurden. Die App auf dem Home-Bildschirm ist davon ausgenommen und hat ihren eigenen Speicher. Daten, die im normalen Safari-Tab eingetragen wurden, sieht die Home-Bildschirm-App nicht und umgekehrt.

Auf dem Mac: In Safari „Ablage → Zum Dock hinzufügen“ (macOS Sonoma oder neuer).

## 3. Gemeinsam aktuell halten

1. **Einmalig:** In der Dateien-App in iCloud Drive einen Ordner „Reiseatelier“ anlegen, lange drücken → Teilen → Personen hinzufügen, Berechtigung „Kann Änderungen vornehmen“.
2. **Bevor man etwas ändert:** In der App auf „Laden“ tippen (Startseite oder Einstellungen) und `reiseatelier-abgleich.json` aus dem Ordner wählen.
3. **Nachdem man etwas geändert hat:** „Speichern“ → im Teilen-Menü „In Dateien sichern“ → Ordner „Reiseatelier“ → **Ersetzen**.

Beim Laden wird zusammengeführt, nicht überschrieben: Pro Station und Tagebucheintrag gewinnt die neuere Änderung, Löschungen werden übernommen, und vorher wird eine Sicherheitskopie angelegt. Auch eine ältere Datei richtet keinen Schaden an.

## Unterwegs ohne Internet

Die App startet und arbeitet offline: Route, Planung, Tagebuch, Fotos, Ortssuche (eingebaute Liste mit rund 49.000 Orten) und eine Weltkarte mit Länderumrissen. Bereits angesehene Kartenausschnitte bleiben gespeichert. Online kommen die Detailkarte (OpenStreetMap), die genauere Ortssuche und der Abruf von Länder- und Klimadaten dazu.

## Aktualisieren

Neue Dateien einfach über die alten hochladen. Die Reisedaten bleiben dabei auf den Geräten erhalten. Beim nächsten Öffnen mit Internet lädt die App die neue Version.

# Neuseeland 2026 – Reiseführer

**Version 5.7** – statischer HTML-Reiseführer für die Südinsel-Rundreise vom **7. bis 17. September 2026**.

## Route

1. Christchurch
2. **8. September:** TranzAlpine von Christchurch nach Greymouth, weiter nach Hokitika
3. Hokitika Gorge und Franz Josef
4. Franz Josef über Haast Pass nach Wānaka
5. Wānaka, Lindis Pass und Aoraki / Mount Cook
6. Lake Tekapo und Mackenzie Basin
7. Lake Tekapo nach Kaikōura
8. Kaikōura: Wale, Robben und Peninsula Walkway
9. Kaikōura nach Akaroa
10. Akaroa und Banks Peninsula
11. Akaroa nach Christchurch Airport

Mietwagenrückgabe: **17. September bis 17:00 Uhr** am Christchurch Airport. Abflug: **20:00 Uhr**.

## Version 5.7 – Tagesatlas und Etappenkarten

- neuer Bereich **„Tagesatlas“** mit 11 Tageskarten für die vollständige Route
- jede Tageskarte zeigt eine lokal erzeugte, offline verfügbare schematische Karte mit Start, Ziel und Streckenverlauf
- Bilder der prägenden Landschaftsräume wurden den passenden Etappen als Bildanker zugeordnet
- Tagesseiten im Detaildialog enthalten jetzt Karte, Streckenfolge, Tagesrhythmus und einen realistischen Plan B
- die Tageskarten sind bewusst keine Navigation: Für die tatsächliche Fahrt bleiben Karten-App, NZTA, DOC und Wetterlage maßgeblich
- neue Datei `assets/js/day-atlas.js`; sie ist im Offline-Cache enthalten

## Lokal öffnen

`index.html` direkt im Browser öffnen. Ein Build-Schritt ist nicht nötig.

Für die installierbare Web-App und den Offline-Cache muss der Guide über HTTPS ausgeliefert werden, zum Beispiel über GitHub Pages. Beim direkten Öffnen einer lokalen Datei stehen Service Worker und Offline-Cache nicht zur Verfügung.

Die interaktive Karte sowie externe Links benötigen Internet. Die Tageskarten, Bilder, Reisedaten, Formulare und persönlichen Eingaben liegen im Projekt beziehungsweise im lokalen Browser-Speicher.

## GitHub Pages

1. Den **Inhalt** dieses Ordners in das Repository `Axholio/neuseeland-2026-guide` hochladen und gleichnamige Dateien ersetzen.
2. In **Settings → Pages** die Quelle `main` / `/(root)` aktivieren.
3. Die veröffentlichte Seite einmal vollständig öffnen, bevor sie offline verwendet wird.
4. Auf dem jeweiligen Gerät die Browserfunktion zum Startbildschirm hinzufügen oder den Installationsknopf im Guide verwenden.

## Inhalt bearbeiten

Reiseetappen, Übernachtungen, Routenpunkte, Planungspunkte, Wetterfenster, Checklisten, Direktlinks und die Texte für den Tagesatlas stehen in:

```text
assets/data/trip-data.js
```

Die Darstellung des Tagesatlas liegt hier:

```text
assets/js/day-atlas.js
assets/css/styles.css
```

Bilder und Bildnachweise liegen hier:

```text
assets/images/
assets/images/ATTRIBUTIONS.md
```

Die Web-App-Konfiguration liegt in:

```text
manifest.webmanifest
service-worker.js
assets/js/pwa.js
assets/js/calendar-export.js
assets/js/travel-mode.js
```

## Wichtiger Umgang mit lokalen Daten

Persönliche Daten werden ausschließlich im lokalen Browser-Speicher abgelegt. Sie werden nicht nach GitHub synchronisiert. Vor dem Wechsel des Geräts oder dem Löschen von Browserdaten die Sicherungsfunktion des Guides verwenden. Keine Passwörter, Kreditkartendaten oder Ausweiskopien in Feldern der Buchungsübersicht speichern.

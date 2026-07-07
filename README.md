# Neuseeland 2026 – Reiseführer

**Version 5.5** – statischer HTML-Reiseführer für die Südinsel-Rundreise vom **7. bis 17. September 2026**.

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

## Version 5.5 – Direktlinks und Quellen

- neuer Bereich **„Links für unterwegs“** mit zentralen Quellen für Straßenlage, Wetter, DOC-Wanderwege, Einreise und Flughafen
- jede Tagesetappe enthält direkte Links zu Karte, Wetter, Straßenlage und den passenden offiziellen Informationsseiten
- Wetterfenster enthalten direkte Prüflinks zu MetService, NZTA und den jeweiligen Aktivitäts- oder Trackseiten
- TranzAlpine, Mietwagenübernahme/-rückgabe, Whale Watch Kaikōura, Dark Sky Project, DOC-Tracks sowie Christchurch Airport sind direkt verlinkt
- Unterkunftseinträge öffnen den jeweiligen Ort unmittelbar in Google Maps
- Planung, Buchungen und Unterlagen verweisen – wo sinnvoll – direkt auf die passende offizielle Quelle
- externe Quellen öffnen bewusst in einem neuen Browser-Tab; aktuelle Hinweise beim jeweiligen Betreiber oder bei der Behörde sind maßgeblich

## Lokal öffnen

`index.html` direkt im Browser öffnen. Ein Build-Schritt ist nicht nötig.

Für die installierbare Web-App und den Offline-Cache muss der Guide über HTTPS ausgeliefert werden, zum Beispiel über GitHub Pages. Beim direkten Öffnen einer lokalen Datei stehen Service Worker und Offline-Cache nicht zur Verfügung.

Die interaktive Karte sowie externe Links benötigen Internet. Bilder, Reisedaten, Formulare und persönliche Eingaben liegen im Projekt beziehungsweise im lokalen Browser-Speicher.

## GitHub Pages

1. Den **Inhalt** dieses Ordners in das Repository `Axholio/neuseeland-2026-guide` hochladen und gleichnamige Dateien ersetzen.
2. In **Settings → Pages** die Quelle `main` / `/(root)` aktivieren.
3. Die veröffentlichte Seite einmal vollständig öffnen, bevor sie offline verwendet wird.
4. Auf dem jeweiligen Gerät die Browserfunktion zum Startbildschirm hinzufügen oder den Installationsknopf im Guide verwenden.

## Inhalt bearbeiten

Reiseetappen, Übernachtungen, Routenpunkte, Planungspunkte, Wetterfenster, Checklisten und die Linklisten stehen in:

```text
assets/data/trip-data.js
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

## Linkquellen (Stand: 7. Juli 2026)

Die folgenden Seiten sind im Guide als externe Quellen hinterlegt:

- Great Journeys NZ – TranzAlpine: `greatjourneysnz.com/scenic-trains/tranzalpine-train/`
- NZ Transport Agency / NZTA Journey Planner: `journeys.nzta.govt.nz`
- MetService: `metservice.com`
- Department of Conservation / DOC: `doc.govt.nz`
- Immigration New Zealand / NZeTA: `immigration.govt.nz`
- Whale Watch Kaikōura: `whalewatch.co.nz`
- Dark Sky Project Takapō: `darkskyproject.co.nz`
- Christchurch Airport: `christchurchairport.co.nz`

Persönliche Daten werden ausschließlich im lokalen Browser-Speicher abgelegt. Sie werden nicht nach GitHub synchronisiert. Vor dem Wechsel des Geräts oder dem Löschen von Browserdaten die Sicherungsfunktion des Guides verwenden. Keine Passwörter, Kreditkartendaten oder Ausweiskopien in Feldern der Buchungsübersicht speichern.

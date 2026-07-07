# Neuseeland 2026 – Reiseführer

**Version 5.3** – statischer HTML-Reiseführer für die Südinsel-Rundreise vom **7. bis 17. September 2026**.

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

Die Rückgabe des Mietwagens ist am **17. September bis 17:00 Uhr** am Christchurch Airport vorgesehen; der Abflug ist für **20:00 Uhr** eingeplant.

## Version 5.3 – Kalender-Export und Offline-Betrieb

- vollständige, korrigierte Tagesroute mit TranzAlpine am 8. September
- Kalender-Export für die komplette Rundreise oder einzelne Tagesetappen als `.ics`-Datei
- Kalenderdateien enthalten nur Route, Datum, Übernachtungsort und Planungsnotizen – keine lokalen Buchungs- oder persönlichen Eingabedaten
- sieben lokal gespeicherte Routenbilder inklusive Lizenznachweisen
- interaktive OpenStreetMap-Übersicht mit anklickbaren Tagesetappen
- Bildansicht im Vollbildmodus mit Tastatursteuerung
- Tagesbriefing, Übernachtungs-, Wetter-, Mietwagen-, Unterlagen-, Buchungs-, Kosten- und Fahrtag-Boards
- lokales Speichern persönlicher Eingaben sowie Export und Import als JSON-Sicherung
- installierbare Web-App über `manifest.webmanifest` und `service-worker.js`
- App-Grundgerüst, Reisedaten, Bilder und persönliche Eingaben nach dem ersten vollständigen Laden offline verwendbar
- Offline-Status und Installationshinweise direkt im Guide

## Lokal öffnen

`index.html` direkt im Browser öffnen. Ein Build-Schritt oder lokaler Server ist nicht erforderlich.

Für die installierbare Web-App und den Offline-Cache muss der Guide über HTTPS ausgeliefert werden, also beispielsweise über GitHub Pages. Beim direkten Öffnen einer lokalen Datei im Browser steht die Service-Worker-Funktion nicht zur Verfügung.

Die interaktive Karte und externe Links benötigen eine Internetverbindung. Die Bilder, Reisedaten, Formulare und persönlichen Einträge liegen im Projekt beziehungsweise im lokalen Browser-Speicher.

## GitHub Pages

1. Den **Inhalt** dieses Ordners in das Repository `Axholio/neuseeland-2026-guide` hochladen und gleichnamige Dateien ersetzen.
2. In **Settings → Pages** die Quelle `main` / `/(root)` aktivieren.
3. Die veröffentlichte Seite einmal vollständig öffnen, bevor sie unterwegs offline verwendet werden soll.
4. Anschließend auf dem jeweiligen Gerät über die Browserfunktion zum Startbildschirm hinzufügen oder – sofern angeboten – den Installationsknopf im Guide nutzen.

## Inhalt bearbeiten

Die Reiseetappen, Übernachtungen, Routenpunkte, Planungspunkte, Wetterfenster und Checklisten stehen in:

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
```

Persönliche Daten werden ausschließlich im lokalen Browser-Speicher abgelegt. Sie werden nicht zurück nach GitHub synchronisiert. Vor dem Wechsel des Geräts oder dem Löschen von Browserdaten die Sicherungsfunktion des Guides verwenden. Keine Passwörter, Kreditkartendaten oder Ausweiskopien in Feldern der Buchungsübersicht speichern.

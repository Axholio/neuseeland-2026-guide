# Neuseeland 2026 – Reiseführer

**Version 5.1** – finaler statischer HTML-Reiseführer für die Südinsel-Rundreise vom **7. bis 17. September 2026**.

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

## Version 5.1 – Abschlussstand

- vollständige, korrigierte Tagesroute mit TranzAlpine am 8. September
- sieben lokal gespeicherte Routenbilder inklusive Lizenznachweisen
- interaktive OpenStreetMap-Übersicht mit anklickbaren Tagesetappen
- Bildansicht im Vollbildmodus mit Tastatursteuerung (Pfeiltasten, Escape)
- Schnellzugriff für Tagesbriefing, Übernachtungen, Wetterfenster und Etappen
- mobil optimierte Darstellung, reduzierte Animationen bei entsprechender Systemeinstellung
- bereinigte Druckansicht mit Route und Etappen, ohne interaktive Planungsfelder
- Buchungs-, Kosten-, Unterkunfts-, Wetter-, Mietwagen-, Unterlagen- und Fahrtag-Boards
- lokales Speichern persönlicher Eingaben sowie Export und Import als JSON-Sicherung

## Lokal öffnen

`index.html` direkt im Browser öffnen. Ein Build-Schritt oder lokaler Server ist nicht erforderlich.

Die Karte benötigt eine Internetverbindung, da sie Kartenkacheln von OpenStreetMap lädt. Die Bilder, Reisedaten und alle übrigen Planungsfunktionen liegen im Projekt.

## GitHub Pages

1. Den **Inhalt** dieses Ordners in das Repository `Axholio/neuseeland-2026-guide` hochladen und gleichnamige Dateien ersetzen.
2. In **Settings → Pages** die Quelle `main` / `/(root)` aktivieren.
3. Nach der Veröffentlichung ist der Guide über GitHub Pages erreichbar.

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

Persönliche Daten werden ausschließlich im lokalen Browser-Speicher abgelegt. Sie werden nicht zurück nach GitHub synchronisiert. Vor dem Wechsel des Geräts oder dem Löschen von Browserdaten die Sicherungsfunktion des Guides verwenden. Keine Passwörter, Kreditkartendaten oder Ausweiskopien in Feldern der Buchungsübersicht speichern.

# Neuseeland 2026 – Reiseführer

**Version 5.0** – statischer, responsiver HTML-Reiseführer für die korrigierte Südinsel-Rundreise vom **7. bis 17. September 2026**.

## Route dieser Version

1. Christchurch
2. TranzAlpine nach Greymouth, weiter nach Hokitika
3. Hokitika Gorge und Franz Josef
4. Franz Josef über Haast Pass nach Wānaka
5. Wānaka, Lindis Pass und Aoraki / Mount Cook
6. Lake Tekapo und Mackenzie Basin
7. Lake Tekapo nach Kaikōura
8. Wale, Robben und Peninsula Walkway
9. Kaikōura nach Akaroa
10. Akaroa und die Buchten der Banks Peninsula
11. Akaroa nach Christchurch Airport

Der TranzAlpine startet am **8. September morgens in Christchurch**. Die Rückgabe des Mietwagens erfolgt am **17. September bis 17:00 Uhr** am Christchurch Airport; der Abflug ist um **20:00 Uhr** vorgesehen.

## Neu in Version 5.0

- sieben lokal gespeicherte Routenbilder in `assets/images/`
- Bilder für TranzAlpine, Hokitika Gorge, Lake Wānaka, Aoraki / Mount Cook, Lake Tekapo, Kaikōura und Akaroa Harbour
- interaktive Übersichtskarte auf OpenStreetMap-Basis
- farblich getrennte Linien für Zugreise, Roadtrip, lokale Tage und Rückfahrt
- anklickbare Linien der Karte öffnen die zugehörige Tagesetappe
- sichtbarer Bereich für Bildnachweise und Lizenzen
- vollständige Lizenz- und Quellenübersicht in `assets/images/ATTRIBUTIONS.md`

## Enthalten

- Tagesetappen und Übernachtungsplan als editierbare Datenquelle (`assets/data/trip-data.js`)
- interaktive Kartenübersicht mit OpenStreetMap-Hintergrund (`assets/js/route-map.js`)
- lokale Bilddateien mit Nachweisen (`assets/images/`)
- responsive Darstellung für Desktop und Mobilgeräte
- Detailansicht zu jeder Etappe inklusive Link zu Google Maps
- Tagesbriefing für die Vorbereitung am Abend davor oder am Morgen
- Filter für Wetterfenster, Buchungspunkte und lange Fahrtage
- Planungsboard für zentrale Buchungs- und Organisationspunkte
- Übernachtungsplan für alle zehn Nächte mit separater lokaler Unterkunftsnotiz je Ort
- Buchungsübersicht für Anbieter, Bestätigungsnummern, Beträge und persönliche Hinweise
- Kostenübersicht mit eigenem Planbudget und laufender Ausgabenerfassung je Kategorie
- Fahrtag-Check mit Tagesstart, Kilometerstand, Abfahrtscheck und Tagesnotiz
- Wetterfenster-Board für sechs wetterkritische Schlüsselstellen inklusive Plan A / Plan B und lokaler Entscheidungsnotiz
- Reiseunterlagen-Check für Einreise, Flüge, TranzAlpine, Mietwagen, Versicherung sowie Zahlung & Offline-Karten
- persönliche Tagesnotizen, Planungsstatus und Buchungsdaten mit lokaler Speicherung im Browser
- Packliste mit lokaler Speicherung im Browser
- Druckansicht für eine kompakte Reiseübersicht
- Export und Import der lokalen persönlichen Eingaben als Sicherungsdatei (JSON)

## Lokal öffnen

`index.html` direkt im Browser öffnen. Es ist kein Build-Schritt und kein lokaler Server erforderlich.

Die Karte benötigt eine Internetverbindung, weil sie Kartenkacheln von OpenStreetMap lädt. Bilder, Reisedaten und alle übrigen Funktionen bleiben lokal im Projekt.

## In GitHub veröffentlichen

1. Den **Inhalt** dieses Ordners in das Repository `Axholio/neuseeland-2026-guide` hochladen und gleichnamige Dateien ersetzen.
2. In **Settings → Pages** die Bereitstellung von `main` / Root aktivieren.
3. Nach der Veröffentlichung ist der Guide über GitHub Pages erreichbar.

## Inhaltlich bearbeiten

Alle Reisetage, Fahrtstrecken, Hinweise, Statuswerte, Planungspunkte sowie die Daten für die Kartenroute stehen gesammelt in:

```text
assets/data/trip-data.js
```

Die lokalen Routenbilder liegen in:

```text
assets/images/
```

Bitte bei einem Austausch der Bilder die Zuordnung in `assets/images/ATTRIBUTIONS.md` sowie die sichtbaren Bildnachweise in `index.html` mitändern.

Persönliche Tagesnotizen, Unterkunftseinträge, Buchungsdaten, Kostenwerte, Fahrtag-Einträge, Wetterbewertungen, Tagesbriefings, Mietwagen-Journal, Unterlagen-Check und Packlisten-Häkchen werden nur im Browser dieses Geräts gespeichert. Sie werden nicht automatisch in GitHub zurückgeschrieben. Über den Bereich **„Planung sichern“** lässt sich eine lokale Sicherungsdatei exportieren und später wieder importieren. Sicherungsdateien nicht in GitHub veröffentlichen. Keine Passwörter, Kreditkartendaten oder Ausweiskopien in die Buchungsübersicht eintragen.

# Neuseeland 2026 – Reiseführer

**Version 6.0 Final** – statischer, installierbarer HTML-Reiseführer für die Südinsel-Rundreise vom **7. bis 17. September 2026**.

## Route

1. Christchurch
2. **8. September:** TranzAlpine von Christchurch nach Greymouth, anschließend weiter nach Hokitika
3. Hokitika Gorge und Franz Josef
4. Franz Josef über Haast Pass nach Wānaka
5. Wānaka, Lindis Pass und Aoraki / Mount Cook
6. Lake Tekapo und Mackenzie Basin
7. Lake Tekapo nach Kaikōura
8. Kaikōura: Walbeobachtung, Robben und Peninsula Walkway
9. Kaikōura nach Akaroa
10. Akaroa und Banks Peninsula
11. Akaroa nach Christchurch Airport

Mietwagenrückgabe: **17. September bis 17:00 Uhr** am Christchurch Airport. Abflug: **20:00 Uhr**.

## Version 6.0 Final

- Route und Tagesfolge nochmals auf die korrekte Grundlage geprüft: Zugfahrt am **8. September** von Christchurch nach Greymouth, danach Westküste, Südalpen, Kaikōura und Akaroa
- Tagesatlas mit 11 schematischen Etappenkarten, Bildankern, Tagesrhythmus und Plan B
- operative Direktlinks je Etappe für NZTA, MetService, DOC, Great Journeys, Whale Watch, Christchurch Airport und Kartenansichten
- Finalcheck für Abreise, Live-Prüfungen, Offline-Nutzung und Rückreisetag
- druckbares **Reise-Kurzblatt** mit Route, Übernachtungen, Schlüsselstellen und Rückgabe-/Abflugzeit
- installierbare Web-App mit Offline-Cache für das Projekt, Bilder und die zentralen Inhalte
- Kalenderexport sowie Sicherung und Wiederherstellung persönlicher Eingaben

## Projekt öffnen

`index.html` direkt im Browser öffnen. Ein Build-Schritt ist nicht nötig.

Für Installation und Offline-Cache muss der Guide per HTTPS ausgeliefert werden, zum Beispiel über GitHub Pages. Beim direkten Öffnen einer lokalen Datei stehen Service Worker und Offline-Cache nicht zur Verfügung.

Interaktive Karte, externe Links und Live-Informationen benötigen eine Internetverbindung. Die Tageskarten, Bilder, Reisedaten, Formulare und persönlichen Eingaben liegen im Projekt beziehungsweise im lokalen Browser-Speicher.

## GitHub Pages

1. Den **Inhalt** dieses Ordners in das Repository `Axholio/neuseeland-2026-guide` hochladen und gleichnamige Dateien ersetzen.
2. In **Settings → Pages** die Quelle `main` / `/(root)` aktivieren.
3. Die veröffentlichte Seite einmal vollständig öffnen, bevor sie offline verwendet wird.
4. Auf dem jeweiligen Gerät die Browserfunktion zum Startbildschirm hinzufügen oder den Installationsknopf im Guide verwenden.

## Reise-Kurzblatt drucken

Über **„Kurzblatt drucken“** im Kopfbereich oder im Finalcheck wird eine kompakte Druckansicht erstellt. Im Druckdialog kann sie als PDF gesichert oder auf Papier ausgegeben werden.

## Inhalt bearbeiten

Reiseetappen, Übernachtungen, Routenpunkte, Planungspunkte, Wetterfenster, Checklisten, Direktlinks und Tagesatlas stehen in:

```text
assets/data/trip-data.js
```

Darstellung und Interaktionen liegen in:

```text
assets/css/styles.css
assets/js/app.js
assets/js/day-atlas.js
assets/js/print-brief.js
```

Bilder und Bildnachweise liegen hier:

```text
assets/images/
assets/images/ATTRIBUTIONS.md
```

Die Web-App-Konfiguration liegt hier:

```text
manifest.webmanifest
service-worker.js
assets/js/pwa.js
```

## Wichtiger Umgang mit lokalen Daten

Persönliche Daten werden ausschließlich im lokalen Browser-Speicher abgelegt. Sie werden nicht nach GitHub synchronisiert. Vor dem Wechsel des Geräts oder dem Löschen von Browserdaten die Sicherungsfunktion des Guides verwenden. Keine Passwörter, Kreditkartendaten oder Ausweiskopien in Feldern der Buchungsübersicht speichern.

Die Kurzblatt- und Tagesplaninhalte sind Planungsgrundlagen. Am Reisetag bleiben aktuelle Hinweise von NZTA, MetService, DOC, Bahn, Flughafen und Aktivitätsanbieter verbindlich.

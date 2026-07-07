# Neuseeland 2026 – Reiseführer

**Version 4.1d** – statischer, responsiver HTML-Reiseführer für den persönlichen Südinsel-Roadtrip vom **5. bis 17. September 2026**.

## Enthalten

- Tagesetappen als editierbare Datenquelle (`assets/data/trip-data.js`)
- Responsive Darstellung für Desktop und Mobilgeräte
- Detailansicht zu jeder Etappe inklusive Link zu Google Maps
- Filter für Wetterfenster, Buchungspunkte und lange Fahrtage
- Planungsboard für zentrale Buchungs- und Organisationspunkte
- Buchungsübersicht für Anbieter, Bestätigungsnummern, Beträge und persönliche Hinweise
- Kostenübersicht mit eigenem Planbudget und laufender Ausgabenerfassung je Kategorie
- Persönliche Tagesnotizen, Planungsstatus und Buchungsdaten mit lokaler Speicherung im Browser
- Packliste mit lokaler Speicherung im Browser
- Druckansicht für eine kompakte Reiseübersicht

## Lokal öffnen

`index.html` direkt im Browser öffnen. Es ist kein Build-Schritt und kein Server erforderlich.

## In GitHub veröffentlichen

1. Den Inhalt dieses Ordners in das Repository `Axholio/neuseeland-2026-guide` hochladen.
2. In **Settings → Pages** die Bereitstellung von `main` / Root aktivieren.
3. Nach der Veröffentlichung ist der Guide über GitHub Pages erreichbar.

## Inhaltlich bearbeiten

Alle Reisetage, Fahrtstrecken, Hinweise, Statuswerte und Planungspunkte stehen gesammelt in:

```text
assets/data/trip-data.js
```

Planungsstatus, persönliche Tagesnotizen, Buchungsdaten und Kostenwerte werden nur im Browser dieses Geräts gespeichert. Sie werden nicht automatisch in GitHub zurückgeschrieben. Keine Passwörter, Kreditkartendaten oder Ausweiskopien in die Buchungsübersicht eintragen.

# Neuseeland 2026 – Reiseführer

**Version 4.1b** – statischer, responsiver HTML-Reiseführer für den persönlichen Südinsel-Roadtrip vom **5. bis 17. September 2026**.

## Enthalten

- Tagesetappen als editierbare Datenquelle (`assets/data/trip-data.js`)
- Responsive Darstellung für Desktop und Mobilgeräte
- Detailansicht zu jeder Etappe inklusive Link zu Google Maps
- Filter für Wetterfenster, Buchungspunkte und lange Fahrtage
- Planungsboard für zentrale Buchungs- und Organisationspunkte
- Persönliche Tagesnotizen und Planungsstatus mit lokaler Speicherung im Browser
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

Die Statuswerte auf der Website sowie persönliche Tagesnotizen werden im Browser dieses Geräts gespeichert. Sie werden nicht automatisch in GitHub zurückgeschrieben.

# Neuseeland 2026 – Reiseführer

**Version 4.1a** – statischer, responsiver HTML-Grundaufbau für den persönlichen Reiseführer zur Südinsel-Rundreise vom **5. bis 17. September 2026**.

## Enthalten

- Tagesetappen als editierbare Datenquelle (`assets/data/trip-data.js`)
- Responsive Darstellung für Desktop und Mobilgeräte
- Detailansicht je Reisetag
- Unterkunfts- und Aufgabenstatus je Etappe
- Packliste mit lokaler Speicherung im Browser
- Druckansicht für eine kompakte Reiseübersicht

## Lokal öffnen

`index.html` direkt im Browser öffnen. Es ist kein Build-Schritt und kein Server erforderlich.

## In GitHub veröffentlichen

1. Den Inhalt dieses Ordners in das Repository `Axholio/neuseeland-2026-guide` hochladen.
2. In **Settings → Pages** die Bereitstellung von `main` / Root aktivieren.
3. Nach der Veröffentlichung ist der Guide über GitHub Pages erreichbar.

## Bearbeitung der Route

Alle Reisetage, Fahrtstrecken, Hinweise, Unterkünfte und Links stehen gesammelt in:

```text
assets/data/trip-data.js
```

Die derzeit eingetragenen Etappen sind ein editierbarer Arbeitsstand für v4.1a.

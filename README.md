# Lead Finder Stuttgart

Webbasiertes Tool zur Neukunden-Recherche für Out-of-Home-Werbung in der Region Stuttgart.
Findet Unternehmen nach Branche und Umkreis, bewertet sie mit einem Lead-Score und zeigt die wichtigsten Kontaktdaten direkt an.

## Starten

1. Repository herunterladen (*Code → Download ZIP*) und entpacken.
2. Doppelklick auf **`Lead-Finder-starten.bat`**.
3. Der Browser öffnet sich mit `http://localhost:8765`. Das schwarze Fenster offen lassen, solange die App genutzt wird.

Voraussetzung: Windows mit PowerShell (vorinstalliert). Keine weitere Installation nötig.

## Funktionen

- Suche nach Ort (23 Orte/Stadtteile der Region) oder eigenem Punkt per Klick in die Karte, Umkreis 2–25 km
- 17 Branchen mit Werbeaffinität 1–5 (Autohäuser, Möbel, Fitness, Immobilien, Kliniken, Optiker, Fahrschulen, Events …)
- Pro Lead: Adresse, Telefon, Website, E-Mail, Öffnungszeiten, Kette/Filiale, Entfernung
- Lead-Score 0–100 (Heiß/Warm/Kalt) aus Branche, Vollständigkeit der Kontaktdaten und lokalem Entscheider
- Pitch-Idee je Branche
- Recherche-Links: Geschäftsführer, Handelsregister (North Data), LinkedIn, Impressum, Google-Bewertungen, News
- Eigene Pipeline mit Status, Wiedervorlage, Ansprechpartner und Notizen
- CSV-Export (Excel-kompatibel)

## Dateien

| Datei | Zweck |
|---|---|
| `lead-finder-stuttgart.html` | Die App (Oberfläche und Logik) |
| `start-leadfinder.ps1` | Kleiner lokaler Server, leitet Datenabfragen an OpenStreetMap weiter |
| `Lead-Finder-starten.bat` | Startet den Server per Doppelklick |

## Hinweise

- Datenquelle: OpenStreetMap über die Overpass API (kostenlos, ohne Anmeldung). Die Daten sind nicht vollständig, Telefonnummern fehlen häufig.
- Der öffentliche Overpass-Server ist zeitweise überlastet. Die App versucht es dann automatisch erneut; sonst später nochmal suchen oder den Umkreis verkleinern.
- Status und Notizen werden nur lokal im Browser gespeichert (nicht im Repository und nicht auf einem Server).
- Daten: © OpenStreetMap-Mitwirkende (ODbL). Karte: © Esri.

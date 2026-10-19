# Lead Finder Stuttgart

Webbasiertes Tool zur Neukunden-Recherche für Out-of-Home-Werbung in der Region Stuttgart.
Findet Unternehmen nach Branche und Umkreis, bewertet sie mit einem Lead-Score und zeigt die wichtigsten Kontaktdaten direkt an.

**App öffnen:** https://mmmmaarrtt.github.io/leadgenerator2/

## So funktioniert es

- Die Web-App läuft auf GitHub Pages – einfach die URL im Browser öffnen, keine Installation.
- Die Firmendaten kommen aus OpenStreetMap. Sie werden **nicht bei jeder Suche** abgefragt, sondern **einmal pro Woche** (Montag früh) von einem GitHub-Job geladen und in `data/cache.json` gespeichert.
- Jede Suche filtert nur diese Datei – sofort und ohne Last auf dem OpenStreetMap-Server.
- Manuell aktualisieren: *Actions → „Daten aktualisieren & veröffentlichen“ → Run workflow*.

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
| `index.html` | Die App (Oberfläche und Logik) |
| `data/cache.json` | Firmendaten der Region, wird wöchentlich automatisch erneuert |
| `scripts/build-data.mjs` | Lädt die Daten aus OpenStreetMap (eine Anfrage pro Branche, mit Pausen) |
| `.github/workflows/update-data.yml` | Wöchentlicher Job: Daten laden + App veröffentlichen |
| `start-leadfinder.ps1`, `Lead-Finder-starten.bat` | Optional: App lokal unter Windows starten |

## Hinweise

- OpenStreetMap-Daten sind nicht vollständig, Telefonnummern fehlen häufig.
- Status und Notizen der Pipeline werden nur lokal im jeweiligen Browser gespeichert – nicht im Repository und nicht auf einem Server.
- Daten: © OpenStreetMap-Mitwirkende (ODbL). Karte: © Esri.

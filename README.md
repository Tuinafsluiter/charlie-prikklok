# Tuinafsluiter Hub v1.0 Live Final

Deze ZIP is bedoeld als final touch om volledig naar GitHub te uploaden.

## Upload naar GitHub
Overschrijf alles uit deze ZIP in je repository.

Belangrijkste bestanden:
- index.html
- manifest.webmanifest
- README.md
- assets/apple-touch-icon.png
- assets/icon-192.png
- assets/icon-512.png
- assets/favicon.png

## App-icoon op iPhone
Na deploy:
1. Verwijder Tuinafsluiter Hub van het beginscherm.
2. Open de site opnieuw in Safari.
3. Wacht 5 seconden.
4. Deel → Zet op beginscherm.
5. Naam: Tuinafsluiter Hub.

Als iPhone nog het oude icoon toont:
- verwijder opnieuw van beginscherm
- sluit Safari volledig
- open de site opnieuw
- voeg opnieuw toe

## Domeinnaam koppelen in Vercel
Aanbevolen domein:
hub.tuinafsluiter.be

Stappen:
1. Vercel → project → Settings → Domains
2. Voeg toe: hub.tuinafsluiter.be
3. Vercel toont welke DNS-record nodig is.
4. Voeg die DNS-record toe bij je domeinbeheerder.
5. Wacht tot Vercel aangeeft: Valid / Ready.

## Voor live start
1. Test met Jos, Rhani, Jordy en Lars.
2. Beginsaldo's controleren.
3. Excel-export maken als backup.
4. Live Start-module gebruiken om testdata te wissen.
5. Daarna officieel starten.

## Geen nieuwe Supabase SQL nodig
Deze versie gebruikt de bestaande tabellen.
Bestaande uren blijven behouden.

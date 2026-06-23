# Tuinafsluiter Hub v1.6 Live Reset Fix

Laatste fix voor live start.

Opgelost:
- Live Start reset wist nu hub_items via de app:
  - teamchat
  - mededelingen
  - activiteitenlog
- Live Start kan ook alle urenregistraties wissen.
- De app controleert na reset of de tabel echt leeg is.
- SQL fallback staat duidelijk in Live Start.
- Werknemers en pincodes blijven behouden.
- Geen nieuwe Supabase SQL nodig.

Upload/overschrijf alles naar GitHub.
Daarna testen:
1. Zet een testbericht in Teamchat.
2. Ga naar Live Start.
3. Klik Wis chat/mededelingen/activiteitenlog.
4. Controleer Supabase hub_items = 0 records.

# Tuinafsluiter Hub v2.3 Actief Tijd

Toegevoegd:
- Admin dashboard toont nu hoelang een actieve werknemer al bezig is.
- Teamoverzicht toont bijvoorbeeld: "Bezig: 1u24 sinds 06:10".
- De teller werkt live en ververst elke minuut.
- De statistiek "Vandaag gewerkt" telt actieve/open registraties mee.
- Geen Supabase-wijziging nodig.

Beveiliging:
- Supabase RLS-waarschuwing blijft belangrijk.
- Deze ZIP wijzigt alleen dashboardweergave.
- RLS moet later via echte auth/backend veilig worden aangepakt, niet zomaar aanzetten.

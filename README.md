# Tuinafsluiter Hub v2.5 Open Registratie Fix

Probleem opgelost:
- Jordy/Lars konden niet opnieuw inchecken omdat er nog een open registratie van gisteren stond.

Nieuw:
- Als iemand wil inchecken terwijl er nog een open registratie van een vorige dag bestaat, vraagt Charlie bevestiging.
- Na bevestiging sluit Charlie die oude registratie automatisch af op 23:59 van die dag.
- Daarna wordt vandaag meteen opnieuw ingecheckt.
- Uitchecken kan nog steeds open registraties afsluiten.
- Geen Supabase-wijziging nodig.
- Bestaande uren blijven behouden.

Upload/overschrijf:
- index.html
- README.md

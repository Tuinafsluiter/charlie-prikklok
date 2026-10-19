# Tuinafsluiter Hub v2.6 Veilig & volledig (19/10/2026)

Gewijzigde bestanden: index.html, api/_common.js, api/login.js, api/supabase.js.
Geen databasewijzigingen. Er wordt niets gewist of herschreven.

Beveiliging:
- Pincodes kunnen niet meer uitgelezen worden via de app (alias/koppeling/filter geblokkeerd).
- Max. 8 foute pincodes per 15 min per toestel (daarna 15 min wachten).
- Werknemers kunnen alleen in-/uitklokken, pauzeren en verlof aanvragen; de server rekent hun uren zelf na.
- Meekijk-account kan geen uren of werknemers wijzigen.
- Wissen in bulk is onmogelijk; werknemers wissen kan niet (gebruik Inactief). Een losse registratie wissen bewaart de inhoud in het activiteitenlog.

Berekening:
- Alle registraties en markeringen worden geladen (geen limiet van 300/250 meer) -> saldo's kloppen over de hele historiek.
- Ziekte wordt ook herkend zonder einduur.
- Vergeten uit te klokken: automatisch afgesloten na 8u werktijd + melding bij Meldingen.
- Datum volgens Belgische tijd (ook tussen 00:00 en 02:00).
- Namen van inactieve werknemers blijven zichtbaar in rapporten.
- Werknemers zien hetzelfde saldo als de beheerder.

Nieuw: knop "💾 Back-up" (vervangt "Live start" met de wisknoppen).

---
# Tuinafsluiter Hub v2.5 Altijd Pincode

Security-aanpassing:
- De app start altijd op het pincode-scherm.
- Bij opnieuw openen wordt de vorige sessie eerst gewist.
- Vergrendel wist nu ook de server-sessie.
- Uitloggen wist de server-sessie.
- Sessie-cookie is beperkt tot 8 uur.
- RLS/backend-beveiliging blijft behouden.

Waarom:
Als iemand een gsm verliest, opent de app niet automatisch meer in het laatst gebruikte account.

Na upload:
1. Vercel redeploy.
2. App openen.
3. Controle: je moet altijd opnieuw pincode ingeven.
4. Inloggen als Jos/Jordy testen.

- Mobiel: Face ID, Vergrendel en Uitloggen staan nu onder de naam over de volledige breedte, zodat Vergrendel niet buiten beeld valt.

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

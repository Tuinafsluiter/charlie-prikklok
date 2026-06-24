# Tuinafsluiter Hub v2.4 Security Backend + RLS voorbereiding

Deze versie zet de frontend niet meer rechtstreeks op Supabase.
De app gaat via Vercel API routes:

- /api/login
- /api/session
- /api/logout
- /api/supabase

## Belangrijk vóór upload naar Vercel/GitHub

Zet in Vercel bij Project → Settings → Environment Variables:

1. SUPABASE_URL
   https://uwtkopnjwewkodozvkxi.supabase.co

2. SUPABASE_SERVICE_ROLE_KEY
   Kopieer deze uit Supabase → Project Settings → API → service_role key.
   NOOIT in index.html zetten.

3. APP_SESSION_SECRET
   Een lange willekeurige tekst, bv. 40+ tekens.

Daarna upload je deze ZIP naar GitHub en wacht je tot Vercel Ready is.

## Test vóór RLS aanzetten

1. Open de app.
2. Log in als Jos.
3. Controleer dashboard.
4. Log in als Jordy/Lars.
5. Test inchecken.
6. Test chat.
7. Test verlof.

Pas als dit werkt: RLS aanzetten.

## SQL om RLS waarschuwing op te lossen

Voer pas uit nadat v2.4 werkt via Vercel API:

```sql
alter table public.werknemers enable row level security;
alter table public.urenregistratie enable row level security;
alter table public.hub_items enable row level security;
```

Geen anon-policies toevoegen.
De app gebruikt de Vercel backend met service role.

## Wat verandert dit?

- De Supabase service key staat alleen op Vercel.
- De browser ziet de service key niet.
- De browser gebruikt een HttpOnly sessie-cookie na pincode-login.
- RLS kan aan zonder dat de app direct via de anon key werkt.

## Let op

Deze versie is een security tussenstap.
De beste lange-termijn oplossing blijft echte Supabase Auth per gebruiker.

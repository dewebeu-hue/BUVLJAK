# Buvljak Deploy Checklist

Kratki checklist za zatvorenu lokalnu betu i Vercel deploy.

## Lokalne varijable

Lokalne tajne drzi u `.env.local`. `.env.example` smije imati samo nazive varijabli bez stvarnih vrijednosti.

Potrebno dokumentirati/postaviti:

```bash
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=
RESEND_API_KEY=
CONTACT_FROM_EMAIL=
OPENAI_API_KEY=
OPENAI_MODEL=
AI_LISTING_ASSISTANT_ENABLED=
AI_MAX_IMAGES=3
AI_DAILY_LIMIT_FREE=1
AI_WEEKLY_LIMIT_FREE=5
AI_GLOBAL_DAILY_LIMIT=100
```

Admin pristup nije konfiguriran preko env varijable. Dopusten je samo za Clerk korisnika s emailom `deweb.eu@gmail.com`.

## Lokalno pokretanje

```bash
npm install
npx convex dev
npm run dev
```

Demo podatke mozes seedati kroz:

```bash
npm run convex:seed
```

Admin dashboard takoder ima akcije za seed, sakrivanje i brisanje oglasa oznacenih kao demo.

## Provjere prije deploya

```bash
npm run lint
npm run typecheck
npm run build
```

Rucno provjeri:

- `/`
- `/oglasi`
- `/oglasi/[id]`
- `/novi-oglas`
- `/moji-oglasi`
- `/moje-potrage`
- `/admin-portal`
- `/admin` treba vratiti 404 i ne smije redirectati na `/admin-portal`
- `/pravila`
- `/privatnost`
- `/paketi`

## Vercel

- Povezi GitHub repo s Vercel projektom.
- U Vercel Project Settings postavi samo frontend/public i Next.js varijable koje aplikacija treba u browseru ili Next runtimeu:
  `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_VERCEL_URL`.
- Provjeri Clerk production keys.
- Provjeri Convex production deployment i `NEXT_PUBLIC_CONVEX_URL`.
- Provjeri Resend sender domenu ili sender email ako se koriste email obavijesti.
- Provjeri da admin pristup radi samo za `deweb.eu@gmail.com`.

## Convex

- Provjeri da Clerk JWT issuer konfiguracija odgovara produkcijskom Clerk projektu.
- Nakon promjene `convex/schema.ts` ili Convex funkcija pokreni `npm run convex:dev` lokalno ili odgovarajući Convex deploy za produkciju; ne uređuj ručno `convex/_generated` datoteke.
- Deployaj Convex funkcije na produkcijski deployment.
- U Convex Dashboardu, na odgovarajucem deploymentu, postavi server-side tajne i flagove:
  `OPENAI_API_KEY`, `OPENAI_MODEL`, `AI_LISTING_ASSISTANT_ENABLED`, `AI_MAX_IMAGES`,
  `AI_DAILY_LIMIT_FREE`, `AI_WEEKLY_LIMIT_FREE`, `AI_GLOBAL_DAILY_LIMIT`,
  `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`.
- `OPENAI_API_KEY` nikad ne smije biti `NEXT_PUBLIC_` varijabla i ne smije biti dostupan frontend bundleu.
- `AI_LISTING_ASSISTANT_ENABLED=false` ili `0` gasi AI prijedlog oglasa bez uklanjanja UI-ja.
- `AI_MAX_IMAGES` treba ostati `3` za MVP. Convex action ne dopusta vise od 3 slike cak ni ako env greskom postavi veci broj.
- Default limiti za zatvorenu betu: `AI_DAILY_LIMIT_FREE=1`, `AI_WEEKLY_LIMIT_FREE=5`, `AI_GLOBAL_DAILY_LIMIT=100`.
- `OPENAI_MODEL` je preporuceno postaviti u Convex env. Ako nije postavljen, Convex action koristi server-side fallback model samo kao dev sigurnosnu mrezu.
- AI usage log biljezi user token identifier, status, broj slika, model, error code i okvirne ulazne bajtove; ne biljezi raw prompt, raw AI output, kontakte ni privatne URL-ove.
- Provjeri da public listing queryji ne vracaju privatne kontakt podatke.
- Provjeri da contact resolver radi samo nakon korisnickog klika i rate limita.

## Nakon deploya

- Otvori home.
- Otvori feed aktivnih oglasa.
- Kreiraj test oglas.
- Otvori detalj oglasa.
- Provjeri "Kopiraj za Facebook".
- Provjeri OG image URL: `/api/og/listing/[id]`.
- Provjeri kontakt resolver.
- Provjeri spremanje potrage.
- Provjeri admin pristup na `/admin-portal`.
- Provjeri da obicni korisnik ne vidi admin dashboard.
- Provjeri da `/admin` vraca 404.
- Provjeri da monetizacija nije vidljiva dok su flagovi ugaseni.
- Provjeri `/pravila` i `/privatnost`.

## Produkcijske sigurnosne napomene

- Buvljak ne obradjuje placanja.
- Nema Stripea, checkouta, provizije ni escrowa u MVP-u.
- Dogovor, placanje, preuzimanje i zamjena odvijaju se izravno izmedju korisnika izvan aplikacije.
- Nema internog chata, komentara, lajkova ni rating sustava.
- Nema Facebook scrapinga ni automatskog objavljivanja u Facebook grupe.
- TODO: dodati privacy-friendly analytics kasnije ako bude stvarne potrebe.

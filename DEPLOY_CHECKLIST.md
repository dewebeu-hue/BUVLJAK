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
ADMIN_EMAILS=
```

`ADMIN_EMAILS` je comma-separated lista admin emailova, bez razmaka je najjednostavnije:

```bash
ADMIN_EMAILS=admin@example.com,drugi-admin@example.com
```

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
- `/admin`
- `/pravila`
- `/privatnost`
- `/paketi`

## Vercel

- Povezi GitHub repo s Vercel projektom.
- Dodaj sve potrebne env varijable u Vercel Project Settings.
- Postavi `NEXT_PUBLIC_APP_URL` na produkcijski URL.
- Provjeri Clerk production keys.
- Provjeri Convex production deployment i `NEXT_PUBLIC_CONVEX_URL`.
- Provjeri Resend sender domenu ili sender email ako se koriste email obavijesti.
- Provjeri OpenAI key ako zelis AI pomoc za Facebook tekst.
- Dodaj admin email u `ADMIN_EMAILS`.

## Convex

- Provjeri da Clerk JWT issuer konfiguracija odgovara produkcijskom Clerk projektu.
- Deployaj Convex funkcije na produkcijski deployment.
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
- Provjeri admin pristup.
- Provjeri da obicni korisnik ne vidi admin dashboard.
- Provjeri da monetizacija nije vidljiva dok su flagovi ugaseni.
- Provjeri `/pravila` i `/privatnost`.

## Produkcijske sigurnosne napomene

- Buvljak ne obradjuje placanja.
- Nema Stripea, checkouta, provizije ni escrowa u MVP-u.
- Dogovor, placanje, preuzimanje i zamjena odvijaju se izravno izmedju korisnika izvan aplikacije.
- Nema internog chata, komentara, lajkova ni rating sustava.
- Nema Facebook scrapinga ni automatskog objavljivanja u Facebook grupe.
- TODO: dodati privacy-friendly analytics kasnije ako bude stvarne potrebe.

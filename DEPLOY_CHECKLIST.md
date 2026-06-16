# Buvljak Deploy Checklist

Kratki checklist za zatvorenu lokalnu betu i Vercel deploy.

## Lokalne varijable

Lokalne tajne drzi u `.env.local`. `.env.example` smije imati samo nazive varijabli bez stvarnih vrijednosti.

`.env.example` je popis lokalnih varijabli za razvoj. U produkciji se iste vrijednosti postavljaju u Vercel dashboardu i/ili Convex dashboardu prema tablici ispod. Ne commitati stvarne kljuceve.

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

## Production env matrix

| Varijabla | Gdje se postavlja | Public/secret | Obavezno za betu | Sigurna beta vrijednost / napomena |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | Vercel | Public | Da | URL produkcijskog Convex deploymenta, ne dev deployment. |
| `NEXT_PUBLIC_APP_URL` | Vercel + Convex | Public | Da | `https://buvljak.hr`; Convex ga koristi za javne linkove u emailovima. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel | Public | Da | Clerk production publishable key, ne development key. |
| `CLERK_SECRET_KEY` | Vercel | Secret | Da | Clerk production secret key. Nikad `NEXT_PUBLIC_`. |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex | Secret/server | Da | Clerk production issuer/frontend API domain za Convex auth. |
| `NEXT_PUBLIC_VERCEL_URL` | Vercel | Public | Ne | Vercel ga moze postaviti automatski; ne koristiti kao glavni production URL umjesto `NEXT_PUBLIC_APP_URL`. |
| `OPENAI_API_KEY` | Convex | Secret | Da za AI | OpenAI secret key samo u Convex env. Nikad `NEXT_PUBLIC_OPENAI_API_KEY`. |
| `OPENAI_MODEL` | Convex | Secret/server | Ne | Preporuceno postaviti; ako nedostaje, AI action ima server-side fallback. |
| `AI_LISTING_ASSISTANT_ENABLED` | Convex | Secret/server | Da | `true` za zatvorenu betu ako AI treba raditi; `false` ili `0` sigurno gasi AI. |
| `AI_MAX_IMAGES` | Convex | Secret/server | Ne | `3`; action ionako ne dopusta vise od 3 slike. |
| `AI_DAILY_LIMIT_FREE` | Convex | Secret/server | Ne | `1` za free korisnika u zatvorenoj beti. |
| `AI_WEEKLY_LIMIT_FREE` | Convex | Secret/server | Ne | `5` za zatvorenu betu. |
| `AI_GLOBAL_DAILY_LIMIT` | Convex | Secret/server | Ne | `100` kao globalni dnevni guardrail za betu. |
| `RESEND_API_KEY` | Convex | Secret | Ne | Potrebno samo ako se salju email upiti ili email obavijesti. |
| `CONTACT_FROM_EMAIL` | Convex | Secret/server | Ne | Verificirani Resend sender, npr. domena/email odobren u Resendu. |
| `CONVEX_DEPLOYMENT` | Convex/local runtime | System | Ne | Convex runtime/CLI vrijednost; ne dodavati rucno u `.env.example` osim ako Convex CLI to sam napravi lokalno. |

U kodu nije pronadjena posebna `FACEBOOK_*` env varijabla. Facebook login ide preko Clerk OAuth konfiguracije, pa se produkcijski Facebook provider i redirect URL-ovi provjeravaju u Clerk dashboardu.

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

## Demo/fallback content check

- [ ] Production `/oglasi` s praznom bazom prikazuje: "Jos nema aktivnih oglasa u tvojoj blizini."
- [ ] Production `/oglasi` bez dostupnog backenda prikazuje: "Trenutno ne mozemo dohvatiti oglase."
- [ ] Production `/oglasi` ne koristi hardcoded `demoListings` kao javni fallback.
- [ ] Production `/oglasi/[id]` za nedostupan, uklonjen ili nepostojeci oglas ne prikazuje demo oglas.
- [ ] OG/share preview za nepostojeci ili nedostupan oglas koristi genericki Buvljak fallback, ne demo oglas.
- [ ] Ako su demo oglasi seedani u Convexu, prije bete ih sakrij ili obrisi kroz admin dashboard.
- [ ] Admin demo alati ostaju dostupni samo admin korisniku na `/admin-portal`.
- [ ] `/pretplate` nema checkout, placanje ili lazni payment flow dok placanja nisu stvarno spojena.
- [ ] AI Listing Assistant ne prikazuje fake rezultat ako AI action nije dostupan; korisnik dobiva jasno error stanje.

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
- `NEXT_PUBLIC_APP_URL` za production mora biti `https://buvljak.hr`.
- `NEXT_PUBLIC_CONVEX_URL` mora pokazivati na produkcijski Convex deployment.
- Provjeri Clerk production keys.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` i `CLERK_SECRET_KEY` moraju biti production kljucevi; development/test kljucevi ne smiju ostati u production environmentu.
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
- Ne postavljati `NEXT_PUBLIC_OPENAI_API_KEY`, `NEXT_PUBLIC_OPENAI_MODEL` ni slicne public OpenAI varijable.
- `NEXT_PUBLIC_APP_URL` postavi i u Convex env na `https://buvljak.hr` jer Convex email funkcije generiraju javne linkove.
- `AI_LISTING_ASSISTANT_ENABLED=false` ili `0` gasi AI prijedlog oglasa bez uklanjanja UI-ja.
- `AI_MAX_IMAGES` treba ostati `3` za MVP. Convex action ne dopusta vise od 3 slike cak ni ako env greskom postavi veci broj.
- Default limiti za zatvorenu betu: `AI_DAILY_LIMIT_FREE=1`, `AI_WEEKLY_LIMIT_FREE=5`, `AI_GLOBAL_DAILY_LIMIT=100`.
- `OPENAI_MODEL` je preporuceno postaviti u Convex env. Ako nije postavljen, Convex action koristi server-side fallback model samo kao dev sigurnosnu mrezu.
- AI usage log biljezi user token identifier, status, broj slika, model, error code i okvirne ulazne bajtove; ne biljezi raw prompt, raw AI output, kontakte ni privatne URL-ove.
- Provjeri da public listing queryji ne vracaju privatne kontakt podatke.
- Provjeri da contact resolver radi samo nakon korisnickog klika i rate limita.

## Pre-launch env checklist

- [ ] Vercel production `NEXT_PUBLIC_APP_URL` je `https://buvljak.hr`.
- [ ] Vercel production `NEXT_PUBLIC_CONVEX_URL` pokazuje na produkcijski Convex deployment.
- [ ] Vercel ima Clerk production `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- [ ] Vercel ima Clerk production `CLERK_SECRET_KEY`.
- [ ] Clerk dashboard ima production domenu i Facebook OAuth redirect URL za `https://buvljak.hr/sso-callback`.
- [ ] Convex production ima `CLERK_JWT_ISSUER_DOMAIN` koji odgovara produkcijskom Clerk projektu.
- [ ] Convex production ima `NEXT_PUBLIC_APP_URL=https://buvljak.hr`.
- [ ] Convex production ima `OPENAI_API_KEY` ako je AI ukljucen.
- [ ] Convex production ima jasno postavljen `AI_LISTING_ASSISTANT_ENABLED`.
- [ ] Convex production ima AI guardrail vrijednosti: `AI_MAX_IMAGES=3`, `AI_DAILY_LIMIT_FREE=1`, `AI_WEEKLY_LIMIT_FREE=5`, `AI_GLOBAL_DAILY_LIMIT=100`.
- [ ] Nigdje ne postoji `NEXT_PUBLIC_OPENAI_API_KEY` ili drugi public OpenAI secret.
- [ ] Ako se koriste email obavijesti, Convex production ima `RESEND_API_KEY` i `CONTACT_FROM_EMAIL`.
- [ ] Nakon promjene Convex funkcija ili schema, pokrenut je `npm run convex:dev` lokalno ili odgovarajuci Convex production deploy.
- [ ] Nakon promjene Vercel env varijabli napravljen je novi production deploy.

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

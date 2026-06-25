# Buvljak.hr launch readiness report

Datum audita: 2026-06-12

## Executive summary

Status: READY WITH NOTES za zatvorenu lokalnu betu.

Preporuka: Buvljak.hr je dovoljno blizu za kontrolirano testiranje s malom grupom korisnika u Novoj Gradiski i okolici, uz obaveznu provjeru produkcijskih env varijabli, Clerk/Facebook konfiguracije i pravnih kontakt podataka prije sireg javnog slanja linka.

Najveci rizici:

- Facebook OAuth ovisi o postavkama u Clerk/Facebook dashboardima koje se ne mogu u potpunosti potvrditi iz repozitorija.
- Produkcijski auth flow ovisi o tome da Clerk JWT template `convex` i Convex env `CLERK_JWT_ISSUER_DOMAIN` budu uskladeni.
- Legal stranice jos imaju kontakt/placeholders koji trebaju stvarne podatke prije javnog lansiranja.
- Direktna `/sign-up` ruta nije implementirana kao stranica; registracija postoji kroz Clerk komponente/modal flow.

## Readiness status

| Area | Status | Notes |
| --- | --- | --- |
| Build/lint/typecheck | PASS | `npm run lint`, `npm run typecheck` i `npm run build` prolaze. Lint ima postojece warnings bez errora. |
| Env vars | NEEDS POLISH | Osnovne varijable postoje, ali `.env.example` ne dokumentira sve Clerk redirect varijable koje su u `.env.local`. |
| Clerk auth | NEEDS MANUAL PROD CHECK | Provider tree izgleda ispravno: `ClerkProvider` u root layoutu i `ConvexProviderWithClerk` unutar njega. Produkcijski dashboard mora biti uskladen. |
| Convex backend | PASS WITH NOTES | Auth config koristi `CLERK_JWT_ISSUER_DOMAIN` i `applicationID: "convex"`. Protected funkcije deriviraju korisnika server-side. |
| Public listings/feed | PASS WITH NOTES | Javne liste ne iznose privatne kontakt podatke. Saved listings flow je odvojen od saved searches. |
| Admin security | PASS | `/admin-portal` je zasticen email guardom preko `ADMIN_EMAIL`; `/admin` ne otkriva portal. Nema vidljivih admin linkova u javnom UI-u. |
| Contact/privacy | PASS WITH NOTES | Kontakt ide kroz gated flow; privatni email/telefon/Facebook nisu dio javnog listing payload-a. |
| Facebook import/share | PASS WITH NOTES | Import ne scrapea Facebook URL; korisnik lijepi tekst. Owner-only Facebook copy tool je sakriven od javnih posjetitelja. |
| Facebook login | NEEDS MANUAL PROD CHECK | UI i fallback postoje, ali stvarna uspjesnost ovisi o Facebook app live statusu, callback URL-ovima i Clerk Social Connections postavkama. |
| Monetization | PASS | Sponsorstva, featured oglasi, pro planovi i payments su feature-flagani i ugaseni po defaultu. Nema Stripe/payment flowa u MVP-u. |
| Legal pages | NEEDS POLISH | `pravila` i `privatnost` postoje, ali treba zamijeniti placeholder kontakt/legal tekstove prije javnog lansiranja. |
| UI/mobile | PASS WITH NOTES | Mobile header koristi burger menu, landing CTA ostaje vidljiv, rolodex ima reduced-motion fallback. Potrebna je jos rucna provjera na stvarnim uredajima. |
| OG/share | PASS WITH NOTES | Listing metadata i dynamic OG image postoje. Produkcija mora imati `NEXT_PUBLIC_APP_URL=https://buvljak.hr`. |

## P0 blockers

Nema potvrdenih P0 blokera u kodu nakon automatiziranih provjera.

P0 uvjet za produkciju: ako produkcijski env nije pravilno postavljen, app moze pasti pri startu ili auth moze pokazivati korisnika u Clerk UI-u bez Convex identityja. To nije kodni blocker, nego deploy konfiguracijski blocker.

## P1 before public beta

1. U Vercelu/produkciji postaviti i provjeriti:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_JWT_ISSUER_DOMAIN`
   - `NEXT_PUBLIC_CONVEX_URL`
   - `NEXT_PUBLIC_CONVEX_SITE_URL`
   - `NEXT_PUBLIC_APP_URL=https://buvljak.hr`
   - `RESEND_API_KEY`
   - `CONTACT_FROM_EMAIL`
   - `OPENAI_API_KEY` ako se koristi AI import/tekst
2. U Convex deploymentu postaviti:
   - `CLERK_JWT_ISSUER_DOMAIN`
   - `RESEND_API_KEY`
   - `CONTACT_FROM_EMAIL`
   - `OPENAI_API_KEY` ako se koristi AI
3. U Clerk dashboardu potvrditi JWT template `convex` i issuer domain koji odgovara Convex env varijabli.
4. U Clerk/Facebook dashboardima potvrditi Facebook app live status i callback URL-ove za local, Vercel i custom domain.
5. Popuniti stvarne kontakt/legal podatke na stranicama `pravila` i `privatnost`.
6. Odluciti treba li dodati stvarnu `/sign-up` route stranicu ili zadrzati registraciju samo kroz Clerk modal/komponente.
7. Rucno proci auth QA na produkciji: login, logout, signup, Google/email, Facebook, Convex auth debug, objava oglasa i upload slike.

## P2 polish

1. Osvjeziti deployment/checklist dokumentaciju koja jos moze spominjati stare nazive poput `Moje potrage`.
2. Proci kompletan mobile QA na stvarnom Android/iOS uredaju, posebno header burger, hero, feed kartice i forma za novi oglas.
3. Dodati smoke test checklistu za vlasnistvo listinga: owner vidi Facebook copy tool, drugi korisnik i logged-out posjetitelj ga ne vide.
4. Razmotriti `/sign-up` rutu radi jasnijeg deep-linkinga iz vanjskih kampanja.
5. Provjeriti stvarne OG previewe u Facebook/WhatsApp debuggerima nakon produkcijskog deploya.

## Detailed audit notes

### Auth and providers

- Root layout koristi Clerk provider, a Convex client provider koristi `ConvexProviderWithClerk` i `useAuth`.
- `convex/auth.config.ts` koristi `process.env.CLERK_JWT_ISSUER_DOMAIN` i `applicationID: "convex"`.
- Protected Convex funkcije ne primaju user id iz klijenta za autorizaciju, nego korisnika izvode iz `ctx.auth.getUserIdentity()`.
- Admin pristup nije baziran samo na role flagu: mora se poklopiti email postavljen u `ADMIN_EMAIL`.

### Env and secret hygiene

- `.env.local` je ignoriran kroz git ignore.
- U repozitoriju nisu nadeni ociti hardkodirani produkcijski secret tokeni.
- `.env.example` pokriva osnovne vrijednosti, ali bi bilo dobro dopuniti ga Clerk redirect varijablama koje app koristi u lokalnom okruzenju.

### User flows

- Guest home prikazuje landing, a authenticated home prikazuje feed.
- `/oglasi` ostaje javno dostupan feed.
- `/novi-oglas` je login-required flow.
- `/spremljeni-oglasi` koristi saved listings/watchlist, ne saved searches.
- Klik na `Spremi` persistira user + listing vezu i sprjecava duplikate.

### Listing privacy

- Public listing payload ne iznosi `contactPhone`, `contactEmail`, `contactFacebookUrl`, `sourceFacebookUrl` ili raw imported Facebook text.
- Kontakt se otkriva kroz namjenski contact request flow.
- Facebook group text tool je owner-only i nije javni alat za posjetitelje.

### Facebook flows

- Facebook import ne scrapea Facebook grupu; korisnik lijepi tekst oglasa.
- Facebook share/copy alat koristi ocisceni tekst i zadrzava owner-only UX.
- Facebook login je launch-risk area jer ovisi o vanjskoj app konfiguraciji, live modeu i callback URL-ovima.

### Monetization

- Monetization schema i admin panel postoje, ali payments i pro plans su ugaseni po defaultu.
- Nema Stripe checkouta, escrowa, aukcija, ratinga, komentara, lajkova ili chata u MVP-u.

### Legal and trust

- `Pravila koristenja` i `Privatnost` postoje i pokrivaju osnovnu MVP logiku.
- Prije javnog lansiranja treba zamijeniti placeholder kontakt/legal podatke stvarnim vrijednostima.

### UI and performance

- Hero image warning za `quality=100` je uklonjen ranije; slika koristi prihvatljiviju kvalitetu.
- Mobile header je pojednostavljen burger menijem.
- Hero rolodex ima reduced-motion fallback i sr-only tekst.
- Upload slike se komprimira prije slanja, sto smanjuje trosak i ubrzava korisnicki flow.

## Manual QA checklist

### Guest

- Otvori `/` i potvrdi landing, hero CTA i burger menu na mobileu.
- Otvori `/oglasi` i listing detail bez login-a.
- Potvrdi da se privatni kontakt podaci ne vide javno.
- Potvrdi da se Facebook copy tool ne vidi logged-out korisniku.
- Klikni `Spremi`; app mora traziti prijavu i ne smije lazno reci da je oglas spremljen.

### Signed-in user

- Sign up/login kroz Clerk.
- Otvori `/` i potvrdi da se prikazuje feed.
- Otvori `/novi-oglas`, ucitaj sliku i objavi testni oglas.
- Otvori isti oglas kao owner i potvrdi da je Facebook copy tool vidljiv.
- Spremi drugi oglas, otvori `/spremljeni-oglasi`, refreshaj i potvrdi da ostaje spremljen.
- Ukloni spremljeni oglas i potvrdi da se stanje vraca.

### Second user

- Otvori tudji oglas.
- Potvrdi da se Facebook copy tool ne vidi.
- Potvrdi da drugi korisnik ne vidi spremljene oglase prvog korisnika.

### Admin

- Logged-out `/admin-portal` ne smije prikazati admin podatke.
- Non-admin logged-in korisnik ne smije pristupiti.
- Samo email postavljen u `ADMIN_EMAIL` smije vidjeti admin portal.
- `/admin` ne smije redirectati na `/admin-portal`.

### Production deploy

- Provjeri `https://buvljak.hr`.
- Provjeri `https://buvljak.hr/oglasi`.
- Provjeri Clerk Google/email login.
- Provjeri Facebook login ili privremeno sakrij CTA ako Facebook app nije live.
- Provjeri Convex auth connected nakon login-a.
- Provjeri OG preview za jedan stvarni oglas.

## Small fix included during QA

Tijekom audita zategnut je development debug log u `convex/savedListings.ts`: logiranje user/listing debug podataka sada je ograniceno na `NODE_ENV=development` ili Convex deployment koji pocinje s `dev:`.

## Automated verification

Pokrenuto 2026-06-12:

- `npm run lint` - PASS, postoje warnings ali nema errora.
- `npm run typecheck` - PASS.
- `npm run build` - PASS.

## Final recommendation

Moze u zatvorenu MVP betu nakon sto se produkcijske env varijable i dashboard konfiguracije potvrde. Za sire javno lansiranje prvo rijesiti P1 listu, posebno Facebook OAuth, Convex auth na produkciji i legal kontakt podatke.

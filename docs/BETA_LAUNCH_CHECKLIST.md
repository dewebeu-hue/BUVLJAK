# Buvljak.hr — zatvorena beta launch checklist

Interna checklist-a prije slanja linka prvim korisnicima iz Nove Gradiške i okolice.

Ovaj dokument je za malu zatvorenu betu s 10-30 poznatih korisnika. Ne predstavlja javni launch i ne zamjenjuje kasniji pravni, sigurnosni ili produkcijski pregled prije sire objave.

## Tehnicka provjera

- [ ] Vercel deployment radi.
- [ ] Produkcijski domain `buvljak.hr` vodi na pravi deployment.
- [ ] `NEXT_PUBLIC_APP_URL` je `https://buvljak.hr`.
- [ ] `NEXT_PUBLIC_CONVEX_URL` pokazuje na pravi Convex deployment.
- [ ] Convex funkcije su deployane na isti deployment koji koristi frontend.
- [ ] Clerk keys su production keys prije javnijeg launch-a.
- [ ] Facebook OAuth redirect URL-ovi su potvrdeni u Clerk dashboardu ako se Facebook login koristi.
- [ ] `OPENAI_API_KEY` je postavljen samo server-side / Convex env.
- [ ] Nema `NEXT_PUBLIC_OPENAI_*` varijabli.
- [ ] `AI_LISTING_ASSISTANT_ENABLED` je jasno postavljen.
- [ ] AI limiti su postavljeni:
  - [ ] `AI_MAX_IMAGES=3`
  - [ ] `AI_DAILY_LIMIT_FREE=1`
  - [ ] `AI_WEEKLY_LIMIT_FREE=5`
  - [ ] `AI_GLOBAL_DAILY_LIMIT=100`
- [ ] Resend env je postavljen ako se email koristi.
- [ ] Nema javnih demo/fallback oglasa.

## Admin provjera

- [ ] Admin access radi samo za admina.
- [ ] Obican korisnik ne moze pristupiti admin portalu.
- [ ] Admin vidi oglase.
- [ ] Admin moze ukloniti, spremiti ili vratiti oglas prema postojecem featureu.
- [ ] Admin moze rjesavati prijave oglasa.
- [ ] Admin demo seed/hide/delete alati su admin-only.
- [ ] Pretplate visibility toggle radi nakon refresh-a.
- [ ] Usluge i pomoc toggle radi nakon refresh-a.
- [ ] AI admin metrike se prikazuju bez rusenja dashboarda.
- [ ] Monetizacija tab ne prikazuje aktivni checkout jer Stripe/online placanje nije ukljuceno.

## Korisnicki tokovi

- [ ] Landing page radi bez prijave.
- [ ] `/oglasi` radi bez prijave.
- [ ] Search i filteri za Stvari rade.
- [ ] Usluge i pomoc su skrivene ako `servicesEnabled=false`.
- [ ] Usluge i pomoc se prikazuju samo ako `servicesEnabled=true`.
- [ ] Objava oglasa zahtijeva login ako je tako postavljeno.
- [ ] Rucna objava oglasa radi bez AI-ja.
- [ ] Upload slika radi.
- [ ] AI Listing Assistant radi ili ima friendly fallback.
- [ ] AI rate limit radi.
- [ ] AI ne blokira rucnu objavu.
- [ ] Detalj oglasa radi za stvarni oglas.
- [ ] Nepostojeci oglas prikazuje friendly not-found state.
- [ ] Kontakt resolver ne prikazuje privatni kontakt javno.
- [ ] Spremanje oglasa radi ili ima friendly login/empty state.
- [ ] Prijava oglasa radi.
- [ ] Moji oglasi prikazuju samo oglase.
- [ ] Moj racun prikazuje privatnost, podatke, brisanje i izvoz.
- [ ] Odjava radi.

## Legal/privacy provjera

- [ ] `/uvjeti-koristenja` postoji i nema placeholdera.
- [ ] `/pravila-privatnosti` postoji i nema placeholdera.
- [ ] `/kolacici` postoji i odgovara stvarnom stanju kolacica.
- [ ] `/kontakt` postoji.
- [ ] Footer linkovi rade.
- [ ] Dobna granica 16+ je jasno navedena gdje treba.
- [ ] Buvljak.hr jasno navodi da ne sudjeluje u placanju, dostavi, escrowu ni izvrsenju dogovora izmedu korisnika.
- [ ] AI privacy sekcija postoji.
- [ ] AI cijena je opisana kao okvirni prijedlog, ne sluzbena procjena vrijednosti.
- [ ] Ne tvrdi se da su pravni dokumenti odvjetnicki verificirani.
- [ ] Ako nema analytics/marketing kolacica, ne prikazuje se nepotreban cookie banner.
- [ ] Ako se kasnije doda analytics/marketing, treba dodati consent prije ucitavanja.

## Mobile QA

- [ ] Landing radi na 360px i 390px.
- [ ] `/oglasi` radi na 360px i 390px.
- [ ] Filter panel na mobitelu radi kroz gumb Filteri.
- [ ] Desktop filteri su vidljivi bez klika.
- [ ] Listing kartice su citljive.
- [ ] Sticky CTA ne prekriva sadrzaj.
- [ ] `/novi-oglas` radi na mobitelu.
- [ ] AI box ne lomi layout.
- [ ] `/pretplate` je citljiv ako je vidljiv.
- [ ] Hamburger navigacija radi.
- [ ] Moj racun je dostupan iz navigacije.
- [ ] Nema horizontalnog overflowa.

## Operativni plan zatvorene bete

- Krenuti s 10-30 poznatih korisnika.
- Ne slati odmah masovno u Facebook grupe.
- Prvo testirati s ljudima koji mogu javiti greske.
- Rucno pratiti prijave oglasa i upite.
- Rucno pratiti AI usage i trosak.
- Rucno pratiti kontakt klikove i najcesce kategorije.
- Prvih 7 dana ne uvoditi nove velike funkcije osim hitnih popravaka.

## Feedback pitanja za prve korisnike

- Je li ti jasno sto je Buvljak.hr?
- Jesi li znao/la gdje objaviti oglas?
- Je li objava oglasa bila jednostavna?
- Je li AI prijedlog bio koristan?
- Je li predlozena cijena bila realna ili zbunjujuca?
- Jesi li razumio/la kako kontaktirati drugu osobu?
- Jesu li filteri jasni?
- Nedostaje li ti nesto prije nego bi ovo preporucio/la drugima?
- Je li aplikacija dovoljno dobra na mobitelu?

## GO / NO-GO

### GO samo ako

- [ ] Build prolazi.
- [ ] Glavne rute rade.
- [ ] Nema javnih demo/fallback oglasa.
- [ ] Nema legal/contact placeholdera.
- [ ] Admin moze ukloniti sporni oglas.
- [ ] Contact resolver ne prikazuje privatne kontakte javno.
- [ ] AI ima server-side rate limit.
- [ ] AI ima fallback ako ne radi.
- [ ] Privacy/terms/footer linkovi rade.
- [ ] Mobile UX nema ocite blokere.
- [ ] Produkcijski env je rucno provjeren.

### NO-GO ako

- [ ] Clerk koristi development keys u produkciji za javniji launch.
- [ ] `NEXT_PUBLIC_CONVEX_URL` pokazuje na krivi deployment.
- [ ] `NEXT_PUBLIC_APP_URL` nije `https://buvljak.hr`.
- [ ] Javni feed prikazuje demo/fallback oglase.
- [ ] Kontakt podaci cure javno.
- [ ] AI nema rate limit.
- [ ] Admin ne moze ukloniti oglas.
- [ ] Legal stranice imaju placeholder podatke.
- [ ] Mobile objava oglasa je slomljena.

## Predloženi tekst za prve beta korisnike

Buvljak.hr je u zatvorenoj beta verziji za Novu Gradišku i okolicu. Testiramo jednostavnu objavu lokalnih oglasa, AI pomoć za opis oglasa i direktan kontakt između korisnika. Ako vidiš grešku ili ti nešto nije jasno, pošalji nam poruku. Ovo još nije javni launch.

## Dnevni beta monitoring checklist

Za prvih 7 dana:

- [ ] Provjeriti nove oglase.
- [ ] Provjeriti prijave oglasa.
- [ ] Provjeriti admin dashboard.
- [ ] Provjeriti AI usage.
- [ ] Provjeriti contact clickove ako postoje.
- [ ] Provjeriti ima li korisnickih poruka na email.
- [ ] Zapisati top 3 problema korisnika.
- [ ] Ne siriti javno dok se P0 problemi ne rijese.

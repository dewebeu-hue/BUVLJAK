import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Pravila privatnosti | Buvljak.hr",
  description:
    "Beta pravila privatnosti za Buvljak.hr, lokalnu platformu za oglase i potrage."
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Beta privatnost"
      title="Pravila privatnosti"
      subtitle="Ova stranica objašnjava koje podatke Buvljak.hr obrađuje u beta verziji za Novu Gradišku i okolicu."
    >
      <LegalSection title="1. Voditelj obrade">
        <p>Voditelj obrade osobnih podataka je deweb j.d.o.o.</p>
        <p>
          Kontakt za pitanja i zahtjeve vezane uz privatnost je{" "}
          <a href="mailto:deweb.eu@gmail.com" className="font-black text-mossDark underline">
            deweb.eu@gmail.com
          </a>
          .
        </p>
        <p>Buvljak.hr je beta lokalna aplikacija za osobe starije od 16 godina.</p>
      </LegalSection>

      <LegalSection title="2. Koje podatke obrađujemo">
        <LegalList
          items={[
            "email i osnovni identitet iz Clerk prijave",
            "ime, prikazano ime i profilne podatke ako ih korisnik unese ili ih prijava pošalje aplikaciji",
            "sadržaj oglasa: naslov, opis, cijenu, kategoriju, tip oglasa i status",
            "slike oglasa koje korisnik prenese",
            "grad ili lokaciju koju korisnik unese, primjerice Nova Gradiška i okolica",
            "odabranu kontakt metodu, primjerice WhatsApp, email, Facebook link ili bez kontakta",
            "kontakt klikove, ponude i kratke poruke poslane kroz kontakt resolver",
            "fotografije predmeta i draft podatke oglasa ako korisnik pokrene AI pomoćnika za oglase",
            "spremljene oglase i spremljene potrage ako korisnik koristi te funkcije",
            "prijave oglasa, razloge prijave i administrativne odluke vezane uz moderaciju",
            "tehničke podatke potrebne za sigurnost, rate limit, sprječavanje zloupotrebe i rad aplikacije"
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Zašto koristimo podatke">
        <LegalList
          items={[
            "za prijavu, korisnički račun i povezivanje korisnika s oglasima",
            "za objavu, prikaz, uređivanje statusa i upravljanje oglasima",
            "za kontakt oko oglasa, slanje upita, ponuda ili prijedloga zamjene",
            "za pripremu AI prijedloga oglasa ako korisnik sam pokrene AI pomoćnika",
            "za spremanje oglasa i potraga ako korisnik koristi te funkcije",
            "za email obavijesti o spremljenim potragama ako su uključene",
            "za moderaciju, prijave oglasa, sigurnost i sprječavanje spama ili zloupotrebe",
            "za korisničku podršku i odgovore na zahtjeve korisnika"
          ]}
        />
      </LegalSection>

      <LegalSection title="4. AI pomoćnik za oglase" tone="notice">
        <p>
          Korisnik može koristiti AI pomoćnika za prijedlog naslova, opisa, kategorije, stanja
          predmeta, okvirne cijene i teksta za dijeljenje oglasa. AI pomoćnik se koristi samo kada ga
          korisnik sam pokrene.
        </p>
        <p>
          AI može obraditi fotografije predmeta koje korisnik pošalje u AI analizu te tekstualne
          podatke iz drafta oglasa, primjerice tip oglasa, naslov, opis, kategoriju i lokalni kontekst.
          Buvljak.hr nastoji AI servisu slati samo podatke potrebne za pripremu prijedloga oglasa.
        </p>
        <p>
          Ne šalji osobne dokumente, lica, registarske oznake, telefonske brojeve, emailove, Facebook
          profile ili druge privatne podatke kroz AI analizu.
        </p>
        <p>
          AI prijedlog je pomoćni alat i može pogriješiti. Korisnik mora provjeriti opis, stanje
          predmeta, kategoriju i cijenu prije objave. Prijedlog cijene nije službena procjena vrijednosti
          niti jamstvo tržišne cijene.
        </p>
        <p>
          Radi sigurnosti, ograničenja troška i sprječavanja zloupotrebe Buvljak.hr može bilježiti
          tehničke metapodatke o korištenju AI funkcije, poput broja slika, statusa zahtjeva, modela i
          vremena zahtjeva. U usage logu ne bilježimo raw AI promptove, raw AI outpute ni privatne
          kontakt podatke.
        </p>
      </LegalSection>

      <LegalSection title="5. Vanjski pružatelji">
        <p>Buvljak.hr koristi ili može koristiti ove pružatelje koji su pronađeni u stvarnom kodu ili konfiguraciji:</p>
        <LegalList
          items={[
            "Clerk za autentifikaciju, korisničke sesije i Facebook login ako ga korisnik odabere",
            "Convex za backend, bazu podataka, autorizirane funkcije i storage slika",
            "Vercel za hosting, build i tehničko posluživanje aplikacije",
            "Resend za slanje email upita i email obavijesti ako je email slanje uključeno",
            "OpenAI za AI pomoć pri analizi fotografija predmeta te parsiranju ili generiranju teksta oglasa ako korisnik koristi AI funkciju",
            "Facebook/Meta samo kada korisnik odabere Facebook prijavu ili spremi/otvori Facebook kontakt link"
          ]}
        />
        <p>U kodu nisu pronađeni dodatni analitički ili marketinški alati za praćenje korisnika.</p>
      </LegalSection>

      <LegalSection title="6. Kolačići i slične tehnologije" tone="notice">
        <p>
          Buvljak.hr u beta verziji koristi samo nužne kolačiće i slične tehnologije potrebne za rad
          aplikacije, prijavu korisnika, sigurnost i spremanje osnovnih postavki. Za takve kolačiće nije
          potrebna posebna privola.
        </p>
        <p>
          Detaljnija obavijest dostupna je na stranici{" "}
          <Link href="/kolacici" className="font-black text-mossDark underline">
            Kolačići
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="7. Javni dio oglasa">
        <p>
          Javni dio oglasa, primjerice naslov, opis, fotografije, grad, kategorija, tip oglasa i cijena,
          mogu vidjeti drugi korisnici i tražilice ako stranica nije tehnički ograničena.
        </p>
        <p>
          Privatni kontakt podaci ne prikazuju se javno u feedu oglasa. Koriste se kroz postojeći kontakt
          flow ovisno o odabiru korisnika.
        </p>
      </LegalSection>

      <LegalSection title="8. Plaćanja, dostava i chat">
        <p>
          Buvljak.hr u MVP-u nema online plaćanja, obradu plaćanja, dostavu kroz platformu ni interni
          chat. Platforma ne prikuplja podatke o karticama, IBAN-u ni plaćanjima kroz aplikaciju.
        </p>
        <p>Buvljak.hr ne prodaje osobne podatke korisnika.</p>
      </LegalSection>

      <LegalSection title="9. Kako ostvariti svoja prava">
        <p>Korisnik može zatražiti:</p>
        <LegalList
          items={[
            "pristup svojim podacima",
            "ispravak netočnih ili nepotpunih podataka",
            "brisanje računa ili podataka",
            "ograničenje obrade",
            "prigovor na obradu",
            "prijenos podataka ako je primjenjivo"
          ]}
        />
        <p>
          Zahtjev se šalje na{" "}
          <a href="mailto:deweb.eu@gmail.com" className="font-black text-mossDark underline">
            deweb.eu@gmail.com
          </a>{" "}
          s email adrese kojom koristiš Buvljak.hr, kako bismo lakše provjerili da zahtjev dolazi od
          stvarnog korisnika računa.
        </p>
        <p>
          Za brisanje računa ili osjetljivije izmjene možemo zatražiti dodatnu provjeru identiteta prije
          provedbe zahtjeva.
        </p>
      </LegalSection>

      <LegalSection title="10. Brisanje i zadržavanje podataka">
        <p>
          Korisnik može zatražiti brisanje računa ili svojih podataka slanjem zahtjeva na{" "}
          <a href="mailto:deweb.eu@gmail.com" className="font-black text-mossDark underline">
            deweb.eu@gmail.com
          </a>
          .
        </p>
        <p>
          Neki podaci mogu ostati sačuvani ako su potrebni za sigurnost, sprječavanje zloupotrebe,
          rješavanje prijava, administrativnu evidenciju ili zakonske obveze.
        </p>
        <p>
          Javno objavljeni oglasi koje su indeksirale tražilice ili podijelili drugi korisnici mogu neko
          vrijeme ostati vidljivi izvan izravne kontrole Buvljak.hr-a.
        </p>
      </LegalSection>

      <LegalSection title="11. Beta napomena">
        <p>Ovo su početne beta informacije i mogu se dopuniti prije šire javne objave.</p>
        <p>Zadnja izmjena: 16.06.2026.</p>
      </LegalSection>
    </LegalPage>
  );
}

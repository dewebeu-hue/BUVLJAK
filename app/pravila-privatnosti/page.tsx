import type { Metadata } from "next";
import { LegalList, LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Pravila privatnosti | Buvljak.hr",
  description:
    "Kratka beta pravila privatnosti za Buvljak.hr, lokalnu platformu za oglase i potrage."
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Beta privatnost"
      title="Pravila privatnosti"
      subtitle="Ova stranica kratko objašnjava koje podatke Buvljak.hr može obrađivati u beta fazi i zašto."
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
      </LegalSection>

      <LegalSection title="2. Koje podatke možemo prikupljati">
        <LegalList
          items={[
            "email i osnovni identitet iz Clerk prijave",
            "ime i profilne podatke ako ih korisnik unese",
            "sadržaj oglasa, opis, cijenu, kategoriju i status oglasa",
            "fotografije oglasa",
            "grad ili lokaciju koju korisnik odabere",
            "kontakt metodu koju korisnik odabere, poput WhatsAppa, emaila ili Facebook linka",
            "tehničke podatke potrebne za sigurnost, rate limit i rad aplikacije",
            "spremljene oglase ili potrage ako korisnik koristi te funkcije",
            "prijave oglasa i administrativne radnje potrebne za moderaciju"
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Zašto koristimo podatke">
        <LegalList
          items={[
            "za korisnički račun i prijavu",
            "za objavu, prikaz i upravljanje oglasima",
            "za kontakt oko oglasa",
            "za spremanje oglasa ili potraga ako funkcionalnost postoji",
            "za sprječavanje spama, prijevara i zloupotrebe",
            "za korisničku podršku",
            "za moderaciju, sigurnost i osnovni rad platforme"
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Vanjski pružatelji">
        <p>Buvljak.hr može koristiti ove pružatelje usluga za rad aplikacije:</p>
        <LegalList
          items={[
            "Clerk za autentifikaciju korisnika",
            "Convex za bazu podataka, backend i storage",
            "Vercel za hosting",
            "Resend za email ako je email slanje uključeno",
            "OpenAI za pomoć pri generiranju teksta oglasa ako korisnik koristi AI funkciju"
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Plaćanja i osjetljivi financijski podaci" tone="notice">
        <p>
          Buvljak.hr u MVP-u ne prikuplja podatke o karticama, IBAN-u ni plaćanjima. U ovoj fazi nema
          Stripe ni online plaćanja kroz platformu.
        </p>
        <p>Buvljak.hr ne prodaje osobne podatke korisnika.</p>
      </LegalSection>

      <LegalSection title="6. Javni dio oglasa">
        <p>
          Javni dio oglasa, primjerice naslov, opis, fotografije, grad, kategorija i cijena, mogu vidjeti
          drugi korisnici i tražilice ako stranica nije tehnički ograničena.
        </p>
        <p>
          Kontakt podaci se ne prikazuju javno u feedu oglasa, nego se koriste kroz postojeći kontakt flow
          ovisno o odabiru korisnika.
        </p>
      </LegalSection>

      <LegalSection title="7. Brisanje računa i podataka">
        <p>
          Korisnik može zatražiti brisanje računa ili svojih podataka slanjem zahtjeva na{" "}
          <a href="mailto:deweb.eu@gmail.com" className="font-black text-mossDark underline">
            deweb.eu@gmail.com
          </a>
          .
        </p>
        <p>
          Neki podaci mogu ostati sačuvani ako su potrebni za sigurnost, sprječavanje zloupotrebe,
          rješavanje prijava ili zakonske obveze.
        </p>
      </LegalSection>

      <LegalSection title="8. Beta napomena">
        <p>Ovo su početna beta pravila privatnosti i mogu se dopuniti prije šire javne objave.</p>
        <p>Zadnja izmjena: 13.06.2026.</p>
      </LegalSection>
    </LegalPage>
  );
}

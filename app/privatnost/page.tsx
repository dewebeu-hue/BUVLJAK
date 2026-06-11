import type { Metadata } from "next";
import { LegalList, LegalPage, LegalSection, NeedsEdit } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privatnost | Buvljak",
  description: "Beta objašnjenje koje podatke Buvljak obrađuje, zašto ih obrađuje i kako štiti korisnike."
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Beta privatnost"
      title="Privatnost"
      subtitle="Ova stranica objašnjava koje podatke Buvljak obrađuje u beta fazi i zašto."
    >
      <LegalSection title="1. Voditelj obrade">
        <p>
          Voditelj obrade osobnih podataka je:{" "}
          <NeedsEdit>[UPIŠI PUNI NAZIV FIRME / OBRT / FIZIČKA OSOBA]</NeedsEdit>
        </p>
        <p>
          Kontakt: <NeedsEdit>[UPIŠI KONTAKT EMAIL]</NeedsEdit>
        </p>
        <p>
          Adresa, ako se javno navodi: <NeedsEdit>[UPIŠI ADRESU ILI IZBACI OVAJ REDAK]</NeedsEdit>
        </p>
        <p>
          Napomena: <NeedsEdit>[PROVJERI S ODVJETNIKOM KOJI TOČAN NAZIV I PODATKE MORAŠ NAVESTI]</NeedsEdit>
        </p>
      </LegalSection>

      <LegalSection title="2. Koje podatke obrađujemo">
        <p>Buvljak može obrađivati sljedeće podatke:</p>
        <LegalList
          items={[
            "ime ili prikazno ime korisnika",
            "email adresu",
            "podatke za prijavu putem Clerk autentifikacije",
            "podatke iz oglasa: naslov, opis, grad, kategorija, cijena, slike",
            "kontakt metodu koju korisnik sam unese: WhatsApp broj, email ili Facebook link",
            "spremljene oglase",
            "kontakt klikove i osnovne metrike korištenja",
            "prijave oglasa",
            "tehničke podatke potrebne za rad aplikacije"
          ]}
        />
        <p>Buvljak ne prikazuje javno broj telefona, email ili Facebook kontakt prije korisničke akcije kroz kontakt flow.</p>
      </LegalSection>

      <LegalSection title="3. Zašto obrađujemo podatke">
        <p>Podatke obrađujemo radi:</p>
        <LegalList
          items={[
            "omogućavanja registracije i prijave",
            "objave i upravljanja oglasima",
            "prikaza lokalnog feeda oglasa",
            "omogućavanja kontakta između korisnika",
            "spremanja oglasa za kasnije pregledavanje",
            "moderacije i sprječavanja zloupotrebe",
            "održavanja sigurnosti aplikacije",
            "poboljšanja korisničkog iskustva"
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Pravna osnova">
        <p>Podaci se mogu obrađivati na temelju:</p>
        <LegalList
          items={[
            "izvršavanja usluge koju korisnik zatraži korištenjem aplikacije",
            "legitimnog interesa za sigurnost, moderaciju i sprječavanje zloupotrebe",
            "privole korisnika za određene opcionalne funkcije, ako je primjenjivo",
            "zakonske obveze, ako takva obveza postoji"
          ]}
        />
        <p>
          <NeedsEdit>[PROVJERI TOČNU PRAVNU OSNOVU S ODVJETNIKOM / GDPR SAVJETNIKOM]</NeedsEdit>
        </p>
      </LegalSection>

      <LegalSection title="5. Kontakt podaci">
        <p>Kontakt podaci koje korisnik unese koriste se kako bi drugi korisnici mogli stupiti u kontakt oko oglasa.</p>
        <p>Buvljak ne prikazuje kontakt podatke javno u feedu oglasa.</p>
        <p>
          Kontakt podaci mogu se otvoriti ili upotrijebiti tek nakon korisničke akcije, primjerice klikom na
          &quot;Kontaktiraj&quot;, &quot;Pošalji ponudu&quot; ili sličnu akciju.
        </p>
      </LegalSection>

      <LegalSection title="6. Slike i sadržaj oglasa">
        <p>Korisnik je odgovoran za sadržaj koji objavi.</p>
        <p>Korisnik ne smije objavljivati slike, tekstove ili osobne podatke drugih osoba bez dopuštenja.</p>
      </LegalSection>

      <LegalSection title="7. Facebook uvoz">
        <p>
          Ako korisnik koristi funkciju &quot;Uvezi moj Facebook oglas&quot;, Buvljak ne čita automatski privatne
          Facebook grupe.
        </p>
        <p>Korisnik sam unosi tekst ili link oglasa i potvrđuje podatke prije objave.</p>
        <p>Korisnik smije uvesti samo vlastiti oglas ili oglas za koji ima dopuštenje.</p>
      </LegalSection>

      <LegalSection title="8. Obavijesti">
        <p>
          Ako korisnik uključi opcionalne obavijesti, Buvljak može poslati poruku vezanu uz korisnički račun,
          objavljeni oglas ili spremljeni oglas.
        </p>
        <p>Korisnik može ukloniti spremljeni oglas iz svojeg profila.</p>
      </LegalSection>

      <LegalSection title="9. Kome se podaci mogu proslijediti">
        <p>Buvljak može koristiti vanjske pružatelje usluga za:</p>
        <LegalList
          items={[
            "autentifikaciju korisnika",
            "hosting aplikacije",
            "bazu podataka i backend",
            "slanje emailova",
            "obradu AI funkcija ako su uključene"
          ]}
        />
        <p>Dodaj popis pružatelja:</p>
        <LegalList
          items={[
            "Clerk - autentifikacija",
            "Convex - baza/backend",
            "Vercel - hosting",
            "Resend - email, ako je uključen",
            "OpenAI - AI funkcije, ako su uključene"
          ]}
        />
        <p>
          <NeedsEdit>[PROVJERI I DOPUNI STVARNI POPIS PRUŽATELJA USLUGA PRIJE PRODUKCIJE]</NeedsEdit>
        </p>
      </LegalSection>

      <LegalSection title="10. Koliko dugo čuvamo podatke">
        <p>
          Podatke čuvamo dok su potrebni za rad aplikacije, korisnički račun, objavljene oglase, spremljene oglase,
          sigurnost i zakonske obveze.
        </p>
        <p>
          Korisnik može zatražiti brisanje svojih podataka kontaktom na: <NeedsEdit>[UPIŠI KONTAKT EMAIL]</NeedsEdit>
        </p>
        <p>
          <NeedsEdit>[UPIŠI KONKRETNI ROK ČUVANJA OGLASA, LOGOVA I KONTAKT DOGAĐAJA AKO GA DEFINIRAŠ]</NeedsEdit>
        </p>
      </LegalSection>

      <LegalSection title="11. Prava korisnika">
        <p>Korisnik može zatražiti:</p>
        <LegalList
          items={[
            "pristup svojim podacima",
            "ispravak podataka",
            "brisanje podataka",
            "ograničenje obrade",
            "prigovor na obradu",
            "prijenos podataka, ako je primjenjivo",
            "povlačenje privole, ako se obrada temelji na privoli"
          ]}
        />
        <p>
          Za zahtjeve se korisnik može javiti na: <NeedsEdit>[UPIŠI KONTAKT EMAIL]</NeedsEdit>
        </p>
      </LegalSection>

      <LegalSection title="12. Sigurnost">
        <p>
          Buvljak primjenjuje razumne tehničke i organizacijske mjere za zaštitu podataka, uključujući login sustav,
          kontrolu pristupa i ograničenje javnog prikaza kontakt podataka.
        </p>
      </LegalSection>

      <LegalSection title="13. Djeca">
        <p>
          Buvljak nije namijenjen djeci mlađoj od:{" "}
          <NeedsEdit>[UPIŠI DOBNU GRANICU, NPR. 16 GODINA, I PROVJERI PRAVNO]</NeedsEdit>
        </p>
      </LegalSection>

      <LegalSection title="14. Promjene ove politike">
        <p>Ovu politiku privatnosti možemo povremeno izmijeniti. Nova verzija bit će objavljena na ovoj stranici.</p>
        <p>
          Zadnje ažuriranje: <NeedsEdit>[UPIŠI DATUM]</NeedsEdit>
        </p>
      </LegalSection>
    </LegalPage>
  );
}

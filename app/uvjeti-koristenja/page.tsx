import type { Metadata } from "next";
import { LegalList, LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Uvjeti korištenja | Buvljak.hr",
  description:
    "Beta uvjeti korištenja za Buvljak.hr, lokalnu platformu za oglase, potrage i kontakt korisnika."
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Beta uvjeti"
      title="Uvjeti korištenja"
      subtitle="Buvljak.hr je beta lokalna platforma za prodaju, poklanjanje, razmjenu i potragu stvari u Novoj Gradiški i okolici."
    >
      <LegalSection title="1. Tko upravlja platformom">
        <p>Buvljak.hr-om upravlja deweb j.d.o.o.</p>
        <p>
          Za pitanja o platformi, pravilima ili korisničkom računu možeš se javiti na{" "}
          <a href="mailto:deweb.eu@gmail.com" className="font-black text-mossDark underline">
            deweb.eu@gmail.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Što je Buvljak.hr">
        <p>
          Buvljak.hr je beta lokalna platforma za objavu oglasa, potraga i kontakt korisnika. Prvi fokus
          bete je Nova Gradiška i okolica.
        </p>
        <p>
          Platforma pomaže korisnicima da pronađu oglas ili osobu za dogovor, ali ne sudjeluje u samom
          dogovoru, plaćanju, preuzimanju, dostavi, rezervaciji, zamjeni ili ispunjenju dogovora.
        </p>
      </LegalSection>

      <LegalSection title="3. Dobna granica">
        <p>Buvljak.hr mogu koristiti osobe starije od 16 godina.</p>
        <p>
          Ako korisnik nije siguran smije li samostalno objaviti oglas ili dogovoriti razmjenu, treba
          tražiti pomoć roditelja, skrbnika ili druge odrasle osobe kojoj vjeruje.
        </p>
      </LegalSection>

      <LegalSection title="4. Odgovornost korisnika">
        <p>Korisnik odgovara za istinitost, točnost, zakonitost i ažurnost svakog oglasa koji objavi.</p>
        <LegalList
          items={[
            "korisnik mora imati pravo objaviti tekst i fotografije oglasa",
            "oglas mora opisivati stvarni predmet, potragu, poklanjanje ili razmjenu",
            "cijena, stanje predmeta, lokacija i način preuzimanja moraju biti prikazani pošteno",
            "korisnik treba pauzirati, označiti kao riješeno ili ukloniti oglas kada više nije aktualan"
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Zabranjeni sadržaj">
        <p>Na Buvljak.hr-u nije dopušteno objavljivati ili slati:</p>
        <LegalList
          items={[
            "spam, masovne ili automatizirane poruke",
            "prevarne oglase ili lažno predstavljanje",
            "govor mržnje, prijetnje, uznemiravanje ili uvredljiv sadržaj",
            "ilegalnu robu, opasne proizvode ili ukradenu robu",
            "sadržaj koji krši autorska prava ili prava trećih osoba",
            "tuđe osobne podatke bez dozvole",
            "oglase koji nisu lokalno relevantni za područje bete",
            "sadržaj koji narušava sigurnost, povjerenje ili kvalitetu platforme"
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Moderacija i ograničenja">
        <p>
          Buvljak.hr može odbiti, sakriti, pauzirati, urediti status ili ukloniti oglas ako krši ova
          pravila, ugrožava druge korisnike ili narušava kvalitetu platforme.
        </p>
        <p>
          U slučaju zloupotrebe Buvljak.hr može ograničiti ili blokirati korisnički račun, posebno kod
          spama, prijevara, opasnog sadržaja, ponavljanih prijava ili zloupotrebe kontakt funkcije.
        </p>
      </LegalSection>

      <LegalSection title="7. Dogovor između korisnika" tone="notice">
        <p>
          Buvljak.hr nije kupac, prodavatelj, posrednik u plaćanju, dostavljač ni jamac
          transakcije.
        </p>
        <p>
          Cijena, plaćanje, preuzimanje, dostava, zamjena i stanje predmeta dogovaraju se direktno
          između korisnika izvan platforme.
        </p>
        <p>
          Buvljak.hr u beta verziji nema online plaćanja, proviziju, zaštitu plaćanja, dostavu kroz
          platformu ni interni chat.
        </p>
      </LegalSection>

      <LegalSection title="8. Kontakt funkcija">
        <p>
          Kontakt gumbi smiju se koristiti samo za stvarni interes za oglas, potragu, poklanjanje ili
          razmjenu.
        </p>
        <LegalList
          items={[
            "zabranjene su automatizirane poruke i spam",
            "zabranjeno je slati uvredljive, prijeteće ili obmanjujuće poruke",
            "zabranjena je zloupotreba kontakt funkcije za promociju, iznudu ili prikupljanje podataka"
          ]}
        />
      </LegalSection>

      <LegalSection title="9. Jamstva i odgovornost platforme">
        <p>
          Buvljak.hr ne jamči točnost oglasa, dostupnost predmeta, kvalitetu predmeta, ponašanje
          korisnika ni uspješnost dogovora.
        </p>
        <p>
          Korisnici sami procjenjuju s kim ulaze u dogovor i koriste platformu na vlastitu odgovornost.
        </p>
      </LegalSection>

      <LegalSection title="10. Promjene pravila">
        <p>
          Pravila se mogu mijenjati tijekom beta faze kako bi platforma ostala sigurnija, jasnija i
          korisnija lokalnoj zajednici.
        </p>
        <p>Zadnja izmjena: 13.06.2026.</p>
      </LegalSection>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import { LegalList, LegalPage, LegalSection, NeedsEdit } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Pravila korištenja Buvljaka | Buvljak",
  description: "Beta pravila za objavu, pronalazak, poklanjanje, razmjenu i dogovor oko stvari u blizini."
};

export default function RulesPage() {
  return (
    <LegalPage
      eyebrow="Beta pravila"
      title="Pravila korištenja Buvljaka"
      subtitle="Buvljak je beta alat za lokalnu objavu, pronalazak, poklanjanje, razmjenu i dogovor oko stvari u blizini."
    >
      <LegalSection title="1. Što je Buvljak">
        <p>
          Buvljak je lokalna web aplikacija koja korisnicima omogućuje objavu i pregled oglasa za prodaju,
          poklanjanje, razmjenu i potragu stvari u blizini.
        </p>
        <p>
          Buvljak u beta fazi nije trgovac, ne prodaje robu, ne obrađuje plaćanja, ne organizira dostavu i ne
          jamči za ispravnost, kvalitetu ili dostupnost predmeta iz oglasa.
        </p>
      </LegalSection>

      <LegalSection title="2. Dogovor između korisnika">
        <p>Korisnici se dogovaraju direktno izvan aplikacije, putem kontakta koji sami odaberu.</p>
        <p>Buvljak ne sudjeluje u:</p>
        <LegalList
          items={[
            "plaćanju",
            "isporuci",
            "preuzimanju",
            "zamjeni",
            "provjeri predmeta",
            "povratu novca",
            "jamstvu",
            "poreznim obvezama korisnika"
          ]}
        />
      </LegalSection>

      <LegalSection title="Važna napomena" tone="notice">
        <p>
          Buvljak ne obrađuje plaćanja, nema provizije i nema escrow sustav. Plaćanje, preuzimanje i dogovor
          odvijaju se direktno između korisnika.
        </p>
      </LegalSection>

      <LegalSection title="3. Objavljivanje oglasa">
        <p>Korisnik smije objaviti samo:</p>
        <LegalList
          items={[
            "vlastiti oglas",
            "oglas za koji ima dopuštenje osobe koja prodaje, poklanja, mijenja ili traži predmet"
          ]}
        />
        <p>Zabranjeno je uvoziti ili objavljivati tuđe oglase bez dopuštenja.</p>
        <p>
          Korisnik smije uvesti samo vlastiti Facebook oglas ili oglas za koji ima dopuštenje. Buvljak ne čita
          automatski privatne Facebook grupe.
        </p>
      </LegalSection>

      <LegalSection title="4. Zabranjeni oglasi">
        <p>Zabranjeno je objavljivati:</p>
        <LegalList
          items={[
            "lažne ili obmanjujuće oglase",
            "oglase za predmete koje korisnik nema pravo prodavati, pokloniti ili mijenjati",
            "ilegalne predmete i usluge",
            "opasne predmete",
            "ukradenu robu",
            "sadržaj koji vrijeđa, prijeti ili diskriminira",
            "spam, duplikate i masovne objave",
            "oglase koji nisu lokalno relevantni za područje korištenja aplikacije"
          ]}
        />
        <p>
          <NeedsEdit>[PROVJERI TREBA LI DODATI DETALJNIJI POPIS ZABRANJENIH KATEGORIJA]</NeedsEdit>
        </p>
      </LegalSection>

      <LegalSection title="5. Sigurnost korisnika">
        <p>Korisnicima preporučujemo:</p>
        <LegalList
          items={[
            "dogovoriti preuzimanje na sigurnom i javnom mjestu",
            "provjeriti predmet prije plaćanja ili zamjene",
            "ne slati novac unaprijed nepoznatim osobama",
            "ne dijeliti nepotrebne osobne podatke",
            "prijaviti sumnjive oglase"
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Prijava oglasa i moderacija">
        <p>Korisnici mogu prijaviti sumnjive, lažne, neprimjerene ili zastarjele oglase.</p>
        <p>Buvljak može, bez prethodne najave:</p>
        <LegalList
          items={[
            "pauzirati oglas",
            "ukloniti oglas",
            "ograničiti korisnika",
            "označiti oglas kao riješen ili uklonjen",
            "odbiti sadržaj koji krši pravila"
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Status oglasa">
        <p>Oglas može biti:</p>
        <LegalList items={["aktivan", "pauziran", "riješen", "uklonjen"]} />
        <p>
          Korisnik je dužan označiti oglas kao riješen kada predmet više nije dostupan ili kada potraga više nije
          aktualna.
        </p>
      </LegalSection>

      <LegalSection title="8. Bez plaćanja u aplikaciji">
        <p>Buvljak u MVP/beta fazi ne obrađuje plaćanja i ne naplaćuje proviziju po transakciji.</p>
        <p>
          <NeedsEdit>
            [AKO KASNIJE UVODIŠ PLAĆANJA, PROVJERI DAC7, POREZNE I PRAVNE OBVEZE PRIJE UKLJUČIVANJA]
          </NeedsEdit>
        </p>
      </LegalSection>

      <LegalSection title="9. Monetizacija">
        <p>U budućnosti Buvljak može uvesti:</p>
        <LegalList items={["lokalne sponzore", "isticanje oglasa", "Pro pakete za česte oglašivače"]} />
        <p>
          Takve opcije neće mijenjati činjenicu da se dogovor i transakcija odvijaju direktno između korisnika, osim
          ako se pravila naknadno ne promijene.
        </p>
      </LegalSection>

      <LegalSection title="10. Odgovornost">
        <p>Buvljak nastoji omogućiti jednostavno i sigurnije lokalno povezivanje korisnika, ali ne može jamčiti:</p>
        <LegalList
          items={[
            "istinitost svakog oglasa",
            "identitet ili namjere korisnika",
            "kvalitetu ili stanje predmeta",
            "uspješnost dogovora",
            "sigurnost plaćanja izvan aplikacije"
          ]}
        />
        <p>Korisnici koriste Buvljak na vlastitu odgovornost.</p>
      </LegalSection>

      <LegalSection title="11. Kontakt">
        <p>
          Za pitanja, prijave ili zahtjeve korisnik se može javiti na: <NeedsEdit>[UPIŠI KONTAKT EMAIL]</NeedsEdit>
        </p>
        <p>
          Ako želiš, dodaj: <NeedsEdit>[UPIŠI NAZIV FIRME / VLASNIKA PROJEKTA]</NeedsEdit>
        </p>
      </LegalSection>

      <LegalSection title="12. Izmjene pravila">
        <p>Buvljak može povremeno izmijeniti ova pravila. Nova verzija bit će objavljena na ovoj stranici.</p>
        <p>
          Zadnje ažuriranje: <NeedsEdit>[UPIŠI DATUM]</NeedsEdit>
        </p>
      </LegalSection>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import { LegalList, LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Sigurnost | Buvljak.hr",
  description: "Kratki savjeti za sigurnije dogovore preko Buvljak.hr beta platforme."
};

export default function SafetyPage() {
  return (
    <LegalPage
      eyebrow="Sigurnost"
      title="Sigurnost pri dogovoru"
      subtitle="Dogovor, plaćanje, preuzimanje i zamjena odvijaju se direktno između korisnika izvan Buvljak.hr-a."
    >
      <LegalSection title="Prije dogovora">
        <LegalList
          items={[
            "provjeri opis, fotografije i cijenu prije nego što se javiš",
            "postavi dodatna pitanja ako nešto nije jasno",
            "ne dijeli osobne dokumente, kodove, lozinke ni bankovne podatke",
            "čuvaj komunikaciju i dokaze dogovora"
          ]}
        />
      </LegalSection>

      <LegalSection title="Preuzimanje i plaćanje">
        <LegalList
          items={[
            "provjeri predmet prije plaćanja ili zamjene",
            "ne šalji novac unaprijed nepoznatim osobama ako nisi siguran",
            "dogovaraj preuzimanje na sigurnom i javnom mjestu kad je to moguće",
            "povedi drugu osobu ako se ne osjećaš sigurno"
          ]}
        />
      </LegalSection>

      <LegalSection title="Ako je nešto sumnjivo" tone="notice">
        <LegalList
          items={[
            "prijavi sumnjiv oglas kroz opciju Prijavi oglas ako postoji",
            "sačuvaj poruke, link oglasa i druge dokaze",
            "za prijetnje, prijevare ili nezakonit sadržaj kontaktiraj nadležna tijela"
          ]}
        />
        <p className="mt-3">
          Buvljak.hr u MVP-u nema escrow, zaštitu plaćanja, online plaćanje ni dostavu kroz platformu.
        </p>
      </LegalSection>
    </LegalPage>
  );
}

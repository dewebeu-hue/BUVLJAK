import type { Metadata } from "next";
import { LegalList, LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Kolačići | Buvljak.hr",
  description:
    "Obavijest o kolačićima i sličnim tehnologijama za Buvljak.hr beta verziju."
};

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Beta kolačići"
      title="Obavijest o kolačićima"
      subtitle="Ovdje je ukratko objašnjeno koje kolačiće i slične tehnologije Buvljak.hr koristi u beta verziji za Novu Gradišku i okolicu."
    >
      <LegalSection title="1. Što su kolačići">
        <p>
          Kolačići su male datoteke koje preglednik sprema na uređaj kako bi web stranica mogla
          raditi, zapamtiti sigurnosnu sesiju ili prepoznati osnovno stanje korisnika tijekom korištenja.
        </p>
        <p>
          Slične tehnologije mogu uključivati privremenu pohranu u pregledniku, primjerice sessionStorage,
          kada je to potrebno za stabilan rad aplikacije.
        </p>
      </LegalSection>

      <LegalSection title="2. Koje kolačiće koristi Buvljak.hr" tone="notice">
        <p>
          Buvljak.hr u beta verziji koristi samo nužne kolačiće i slične tehnologije potrebne za rad
          aplikacije, prijavu korisnika, sigurnost i spremanje osnovnih postavki. Za takve kolačiće nije
          potrebna posebna privola.
        </p>
        <LegalList
          items={[
            "nužni auth/session kolačići za prijavu i sigurnost korisničkog računa",
            "tehnička pohrana potrebna za rad aplikacije i zaštitu od zloupotrebe",
            "sessionStorage za privremene radnje u pregledniku, primjerice da se pregled oglasa ne broji više puta u istoj sesiji"
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Preference i lokalna pohrana">
        <p>
          U trenutnom kodu nije pronađena trajna localStorage pohrana za korisničke preference. Ako se u
          budućnosti dodaju postavke koje se pamte u pregledniku, ova obavijest će se dopuniti.
        </p>
      </LegalSection>

      <LegalSection title="4. Analitika i marketing">
        <p>
          U trenutnom kodu nisu pronađeni Google Analytics, Vercel Analytics, Meta Pixel, Microsoft
          Clarity, Hotjar, PostHog, Sentry ni drugi marketing ili tracking scriptovi.
        </p>
        <p>
          Ako se kasnije uvedu analitički ili marketinški kolačići koji nisu nužni za rad aplikacije,
          Buvljak.hr će prije toga dodati jasnu obavijest i odgovarajuću kontrolu privole.
        </p>
      </LegalSection>

      <LegalSection title="5. Kako promijeniti ili obrisati kolačiće">
        <p>
          Nužni kolačići potrebni su za prijavu, sigurnost i rad aplikacije. Ako ih korisnik blokira ili
          obriše, neki dijelovi Buvljak.hr-a možda neće raditi ispravno.
        </p>
        <LegalList
          items={[
            "kolačiće možeš obrisati u postavkama svog preglednika",
            "u pregledniku možeš blokirati kolačiće, ali to može utjecati na prijavu i rad aplikacije",
            "ako koristiš više preglednika ili uređaja, postavke treba provjeriti na svakom od njih"
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Kontakt">
        <p>
          Za pitanja o kolačićima, privatnosti ili obradi podataka možeš se javiti na{" "}
          <a href="mailto:deweb.eu@gmail.com" className="font-black text-mossDark underline">
            deweb.eu@gmail.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="7. Beta napomena">
        <p>Ovo su početne beta informacije i mogu se dopuniti prije šire javne objave.</p>
        <p>Zadnja izmjena: 14.06.2026.</p>
      </LegalSection>
    </LegalPage>
  );
}

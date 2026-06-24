import type { Metadata } from "next";
import { Mail, MapPin, ShieldAlert } from "lucide-react";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Kontakt | Buvljak.hr",
  description: "Kontakt podaci za Buvljak.hr beta platformu u Novoj Gradiški i okolici."
};

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="Kontakt"
      title="Kontakt"
      subtitle="Buvljak.hr je beta lokalna platforma za oglase, potrage i kontakt korisnika u Novoj Gradiški i okolici."
    >
      <LegalSection title="Buvljak.hr">
        <div className="grid gap-3">
          <p>
            <strong>Upravitelj:</strong> deweb j.d.o.o.
          </p>
          <p className="flex flex-wrap items-center gap-2">
            <Mail aria-hidden="true" size={18} className="text-mossDark" />
            <strong>Email:</strong>{" "}
            <a href="mailto:deweb.eu@gmail.com" className="font-black text-mossDark underline">
              deweb.eu@gmail.com
            </a>
          </p>
          <p className="flex flex-wrap items-center gap-2">
            <MapPin aria-hidden="true" size={18} className="text-mossDark" />
            <strong>Područje bete:</strong> Nova Gradiška i okolica
          </p>
        </div>
      </LegalSection>

      <LegalSection title="Prijava spornog oglasa">
        <p>
          Ako postoji opcija &quot;Prijavi oglas&quot;, koristi je direktno na stranici oglasa. Tako prijava ostaje
          vezana uz konkretan oglas i može se brže pregledati.
        </p>
        <p>
          Ako ne možeš koristiti prijavu u aplikaciji, pošalji email na{" "}
          <a href="mailto:deweb.eu@gmail.com" className="font-black text-mossDark underline">
            deweb.eu@gmail.com
          </a>{" "}
          i uključi link oglasa, kratak opis problema i dostupne dokaze.
        </p>
      </LegalSection>

      <LegalSection title="Zahtjev za privatnost i podatke">
        <p>
          Za pristup, ispravak ili brisanje svojih podataka pošalji zahtjev na{" "}
          <a href="mailto:deweb.eu@gmail.com" className="font-black text-mossDark underline">
            deweb.eu@gmail.com
          </a>{" "}
          s email adrese kojom koristiš Buvljak.hr.
        </p>
        <p>
          Za brisanje računa ili podataka može biti potrebna dodatna provjera identiteta prije obrade
          zahtjeva.
        </p>
        <p>
          Podatke za predaju oglasa možeš urediti u stranici Moj račun. Ako trebaš pomoć oko ispravka
          ili brisanja tih podataka, pošalji zahtjev s email adrese kojom koristiš Buvljak.hr.
        </p>
      </LegalSection>

      <LegalSection title="Hitne i ozbiljne situacije" tone="notice">
        <p className="flex gap-3">
          <ShieldAlert aria-hidden="true" size={22} className="mt-0.5 shrink-0 text-clay" />
          <span>
            Za hitne situacije, prijetnje, prijevare ili nezakonit sadržaj sačuvaj dokaze i po potrebi
            kontaktiraj nadležna tijela. Buvljak.hr može pomoći moderacijom platforme, ali nije zamjena za
            policiju, hitne službe ili pravni savjet.
          </span>
        </p>
      </LegalSection>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pravila korištenja | Buvljak",
  description: "Kratka beta pravila za objavu i korištenje lokalnih oglasa na Buvljaku."
};

const rules = [
  "Objavljuj samo svoje oglase ili oglase za koje imaš dopuštenje.",
  "Zabranjeni su lažni, opasni, ilegalni i uvredljivi oglasi.",
  "Buvljak je alat za objavu i povezivanje korisnika. Plaćanje, preuzimanje, zamjena i dogovor odvijaju se direktno između korisnika izvan aplikacije.",
  "Buvljak ne sudjeluje u plaćanju, dostavi, jamstvu, poreznim obvezama ili dogovoru korisnika.",
  "Prijavi sumnjiv oglas kako bi ga admin mogao provjeriti."
];

export default function RulesPage() {
  return (
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-3xl rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <span className="inline-flex rounded-full bg-moss/10 px-3 py-1 text-sm font-black text-mossDark">
          Beta pravila
        </span>
        <h1 className="mt-4 text-4xl font-black leading-tight text-ink">Pravila korištenja</h1>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-ink/64">
          Ovo je kratki beta placeholder i nije zamjena za odvjetnički dokument.
        </p>
        <ul className="mt-6 grid gap-3">
          {rules.map((rule) => (
            <li key={rule} className="rounded-lg bg-field p-4 text-sm font-bold leading-relaxed text-ink/72">
              {rule}
            </li>
          ))}
        </ul>
        <Link
          href="/oglasi"
          className="focus-ring mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
        >
          Natrag na oglase
        </Link>
      </section>
    </main>
  );
}

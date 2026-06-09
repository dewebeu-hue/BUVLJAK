import Link from "next/link";

const privacyItems = [
  "Buvljak prikuplja osnovne podatke potrebne za objavu oglasa i kontakt.",
  "Kontakt podaci se ne prikazuju javno prije korisničkog klika i kontakt resolvera.",
  "Email obavijesti se šalju samo za spremljene potrage ako korisnik to uključi.",
  "Korisnik može pauzirati ili obrisati svoje potrage i oglase."
];

export default function PrivacyPage() {
  return (
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-3xl rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <span className="inline-flex rounded-full bg-moss/10 px-3 py-1 text-sm font-black text-mossDark">
          Beta privatnost
        </span>
        <h1 className="mt-4 text-4xl font-black leading-tight text-ink">Privatnost</h1>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-ink/64">
          Ovo je kratki beta placeholder i nije zamjena za odvjetnički dokument.
        </p>
        <ul className="mt-6 grid gap-3">
          {privacyItems.map((item) => (
            <li key={item} className="rounded-lg bg-field p-4 text-sm font-bold leading-relaxed text-ink/72">
              {item}
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

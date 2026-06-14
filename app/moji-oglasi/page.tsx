import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { MyListingsPanel } from "@/components/my-listings-panel";

export default function MyListingsPage() {
  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <span className="inline-flex rounded-full bg-moss/10 px-3 py-1 text-sm font-black text-mossDark">
          Korisnički profil
        </span>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black leading-tight text-ink">Moji oglasi</h1>
            <p className="mt-3 max-w-2xl text-base font-semibold leading-relaxed text-ink/66">
              Ovdje upravljaš svojim aktivnim, pauziranim i riješenim oglasima.
            </p>
          </div>
          <Link
            href="/novi-oglas"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
          >
            <PlusCircle aria-hidden="true" size={18} />
            Objavi prvi oglas
          </Link>
        </div>

        <MyListingsPanel />
        <PrivacyAccountSection />
      </div>
    </main>
  );
}

function PrivacyAccountSection() {
  return (
    <section className="mt-8 rounded-lg border border-ink/10 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-2xl font-black leading-tight text-ink">Privatnost i račun</h2>
      <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-ink/68 sm:text-base">
        Za zatvorenu betu zahtjevi za brisanje računa i izvoz podataka idu ručno preko emaila. Pošalji
        zahtjev s email adrese kojom koristiš Buvljak.hr.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <a
          href="mailto:deweb.eu@gmail.com?subject=Zahtjev%20za%20brisanje%20racuna%20-%20Buvljak.hr"
          className="focus-ring inline-flex h-11 items-center justify-center rounded-lg border border-clay/20 bg-clay/8 px-4 text-sm font-black text-clay transition hover:bg-clay/12"
        >
          Zatraži brisanje računa
        </a>
        <a
          href="mailto:deweb.eu@gmail.com?subject=Zahtjev%20za%20izvoz%20podataka%20-%20Buvljak.hr"
          className="focus-ring inline-flex h-11 items-center justify-center rounded-lg border border-ink/12 bg-white px-4 text-sm font-black text-ink transition hover:bg-field"
        >
          Zatraži izvoz podataka
        </a>
      </div>
      <p className="mt-3 text-xs font-bold leading-relaxed text-ink/52">
        Automatsko brisanje nije uključeno u MVP-u kako bi se prije obrade moglo provjeriti da zahtjev
        dolazi od stvarnog vlasnika računa.
      </p>
    </section>
  );
}

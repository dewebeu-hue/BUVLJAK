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
      </div>
    </main>
  );
}

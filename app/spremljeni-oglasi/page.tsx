import Link from "next/link";
import { BookmarkCheck, Search } from "lucide-react";
import { SavedListingsPanel } from "@/components/saved-listings-panel";

export default function SavedListingsPage() {
  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <span className="inline-flex rounded-full bg-moss/10 px-3 py-1 text-sm font-black text-mossDark">
          Korisnički profil
        </span>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-black leading-tight text-ink">
              <BookmarkCheck aria-hidden="true" size={34} className="text-mossDark" />
              Spremljeni oglasi
            </h1>
            <p className="mt-3 max-w-2xl text-base font-semibold leading-relaxed text-ink/66">
              Ovdje su oglasi koje si spremio/la za kasnije pregledavanje.
            </p>
          </div>
          <Link
            href="/oglasi"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
          >
            <Search aria-hidden="true" size={18} />
            Pogledaj oglase
          </Link>
        </div>

        <SavedListingsPanel />
      </div>
    </main>
  );
}

import Link from "next/link";
import { ChevronDown, Filter, Plus, Search } from "lucide-react";
import { ListingsFeed } from "@/components/listings-feed";
import { listingTypeLabels } from "@/lib/listings";

const quickFilters = ["Sve", listingTypeLabels.sell, listingTypeLabels.give, listingTypeLabels.swap, listingTypeLabels.want];

const simpleFilters = ["Grad", "Kategorija", "Cijena"];

export default function ListingsPage() {
  return (
    <main className="pb-24">
      <section className="border-b border-ink/8 bg-[#fbfcf7] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-moss/10 px-3 py-1 text-sm font-black text-mossDark">
                Nova Gradiška i okolica
              </span>
              <h1 className="mt-3 text-4xl font-black leading-tight text-ink">Aktivni oglasi</h1>
            </div>
            <Link
              href="/novi-oglas"
              className="focus-ring hidden h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark md:inline-flex"
            >
              <Plus aria-hidden="true" size={18} />
              Novi oglas
            </Link>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <label className="relative block">
              <Search
                aria-hidden="true"
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/42"
              />
              <input
                type="search"
                placeholder="Što tražiš?"
                className="focus-ring h-13 w-full rounded-lg border border-ink/12 bg-white py-3 pl-11 pr-4 text-base font-semibold text-ink placeholder:text-ink/42"
              />
            </label>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {quickFilters.map((filter, index) => (
                <button
                  key={filter}
                  type="button"
                  className={`focus-ring h-11 shrink-0 rounded-full border px-4 text-sm font-black transition ${
                    index === 0
                      ? "border-moss bg-moss text-white"
                      : "border-ink/12 bg-white text-ink/70 hover:bg-field"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {simpleFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className="focus-ring flex h-12 items-center justify-between rounded-lg border border-ink/12 bg-white px-4 text-left text-sm font-black text-ink transition hover:bg-field"
              >
                <span className="inline-flex items-center gap-2">
                  <Filter aria-hidden="true" size={16} className="text-moss" />
                  {filter}
                </span>
                <ChevronDown aria-hidden="true" size={17} className="text-ink/46" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <ListingsFeed />

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              className="focus-ring inline-flex h-12 items-center justify-center rounded-lg border border-ink/12 bg-white px-5 text-base font-black text-ink transition hover:bg-field"
            >
              Učitaj još oglasa
            </button>
          </div>
        </div>
      </section>

      <Link
        href="/novi-oglas"
        className="focus-ring fixed bottom-4 left-4 right-4 z-30 inline-flex h-13 items-center justify-center gap-2 rounded-lg bg-clay px-5 text-base font-black text-white shadow-soft transition hover:bg-[#bd4c31] md:hidden"
      >
        <Plus aria-hidden="true" size={20} />
        + Novi oglas
      </Link>
    </main>
  );
}

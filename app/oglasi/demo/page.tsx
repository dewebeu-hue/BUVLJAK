import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  MessageCircleQuestion,
  Send,
  Share2,
  Tag
} from "lucide-react";
import {
  demoListings,
  formatPrice,
  listingStatusLabels,
  listingTypeLabels
} from "@/lib/listings";

const listing = demoListings[0];

export default function DemoListingDetailPage() {
  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link href="/oglasi" className="focus-ring inline-flex rounded-lg text-sm font-black text-mossDark hover:text-moss">
          Natrag na oglase
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <section className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
            <div className="relative aspect-[4/3] bg-field">
              <Image
                src="/buvljak-local-market.png"
                alt="Placeholder fotografija oglasa"
                fill
                className="object-cover"
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
              />
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-moss/18 bg-moss/10 px-3 py-1 text-sm font-black text-mossDark">
                  <Tag aria-hidden="true" size={15} />
                  {listingTypeLabels[listing.type]}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-honey/24 bg-honey/18 px-3 py-1 text-sm font-black text-[#72520d]">
                  <CheckCircle2 aria-hidden="true" size={15} />
                  {listingStatusLabels[listing.status]}
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight text-ink">{listing.title}</h1>
              <div className="mt-4 flex flex-wrap gap-3 text-base font-black">
                <span className="rounded-lg bg-moss px-4 py-2 text-white">
                  {formatPrice(listing.price, listing.type)}
                </span>
                <span className="rounded-lg bg-field px-4 py-2 text-ink/74">{listing.city}</span>
              </div>

              <p className="mt-5 text-base leading-relaxed text-ink/70">{listing.description}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
              >
                <Send aria-hidden="true" size={17} />
                Kontaktiraj oglašivača
              </button>
              <button
                type="button"
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-4 text-sm font-black text-ink transition hover:bg-field"
              >
                <MessageCircleQuestion aria-hidden="true" size={17} />
                Pitaj je li još dostupno
              </button>
              <button
                type="button"
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-4 text-sm font-black text-ink transition hover:bg-field"
              >
                <Bookmark aria-hidden="true" size={17} />
                Spremi
              </button>
              <button
                type="button"
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-4 text-sm font-black text-ink transition hover:bg-field"
              >
                <Share2 aria-hidden="true" size={17} />
                Podijeli
              </button>
              <button
                type="button"
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-clay/20 bg-clay/8 px-4 text-sm font-black text-clay transition hover:bg-clay/12 sm:col-span-2"
              >
                <AlertTriangle aria-hidden="true" size={17} />
                Prijavi oglas
              </button>
            </div>

            <div className="rounded-lg border border-honey/30 bg-honey/16 p-4">
              <p className="font-bold leading-relaxed text-ink/76">
                Kontakt se u MVP-u odvija izvan aplikacije putem WhatsAppa, emaila ili Facebook
                linka. Nema internog chata.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

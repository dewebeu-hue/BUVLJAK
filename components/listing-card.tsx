import Link from "next/link";
import { Bookmark, ExternalLink, MapPin, Send, Tag } from "lucide-react";
import {
  formatPrice,
  Listing,
  listingStatusLabels,
  listingTypeLabels,
  ListingType
} from "@/lib/listings";

const typeTone: Record<ListingType, string> = {
  sell: "border-moss/20 bg-moss/10 text-mossDark",
  give: "border-honey/30 bg-honey/16 text-[#72520d]",
  swap: "border-plum/20 bg-plum/10 text-plum",
  want: "border-clay/20 bg-clay/10 text-clay"
};

const visualTone: Record<ListingType, string> = {
  sell: "from-moss/28 via-skywash to-honey/28",
  give: "from-honey/38 via-field to-moss/18",
  swap: "from-plum/24 via-skywash to-honey/30",
  want: "from-clay/24 via-field to-skywash"
};

export function ListingCard({ listing }: { listing: Listing }) {
  const created = new Intl.DateTimeFormat("hr-HR", {
    day: "numeric",
    month: "short"
  }).format(new Date(listing.createdAt));

  return (
    <article className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className={`grid aspect-[4/3] place-items-center bg-gradient-to-br ${visualTone[listing.type]}`}>
        <div className="grid h-20 w-20 place-items-center rounded-lg border border-white/70 bg-white/70 text-mossDark shadow-sm">
          <Tag aria-hidden="true" size={32} strokeWidth={1.9} />
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-black ${typeTone[listing.type]}`}>
            {listingTypeLabels[listing.type]}
          </span>
          <span className="rounded-full border border-moss/16 bg-moss/8 px-3 py-1 text-xs font-bold text-mossDark">
            {listingStatusLabels[listing.status]}
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black leading-snug text-ink">{listing.title}</h2>
          <p className="line-clamp-2 min-h-11 text-sm leading-relaxed text-ink/68">
            {listing.description}
          </p>
        </div>

        <div className="grid gap-2 text-sm font-semibold text-ink/70">
          <span className="inline-flex items-center gap-2">
            <MapPin aria-hidden="true" size={16} className="text-moss" />
            {listing.city}
          </span>
          <span className="inline-flex items-center justify-between gap-2 rounded-lg bg-field px-3 py-2 text-ink">
            <span>{listing.category}</span>
            <span className="font-black">{formatPrice(listing.price, listing.type)}</span>
          </span>
        </div>

        <div className="flex items-center justify-between text-xs font-bold text-ink/52">
          <span>Najnovije</span>
          <time dateTime={listing.createdAt}>{created}</time>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Link
            href="/oglasi/demo"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-3 text-sm font-black text-white transition hover:bg-mossDark"
          >
            <ExternalLink aria-hidden="true" size={16} />
            Detalji
          </Link>
          <button
            type="button"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-field"
          >
            <Bookmark aria-hidden="true" size={16} />
            Spremi
          </button>
          <button
            type="button"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-field"
          >
            <Send aria-hidden="true" size={16} />
            Podijeli
          </button>
        </div>
      </div>
    </article>
  );
}

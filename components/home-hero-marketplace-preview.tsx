"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  CircleDollarSign,
  Gift,
  type LucideIcon,
  Megaphone,
  Repeat2,
  Search,
  Tag
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import {
  formatListingPrice,
  fromConvexListing,
  listingTypeMeta,
  type Listing,
  type ListingType
} from "@/lib/listings";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

const categoryShortcuts: Array<{
  type: ListingType;
  label: string;
  href: string;
  icon: LucideIcon;
}> = [
  { type: "sell", label: "Prodajem", href: "/oglasi?type=sell", icon: CircleDollarSign },
  { type: "give", label: "Poklanjam", href: "/oglasi?type=give", icon: Gift },
  { type: "swap", label: "Mijenjam", href: "/oglasi?type=swap", icon: Repeat2 },
  { type: "want", label: "Tražim", href: "/oglasi?type=want", icon: Search }
];

export function HomeHeroMarketplacePreview() {
  if (!hasConvexUrl) {
    return (
      <HeroPreviewShell>
        <HeroPreviewIntro />
      </HeroPreviewShell>
    );
  }

  return <ConnectedHomeHeroMarketplacePreview />;
}

function ConnectedHomeHeroMarketplacePreview() {
  const convexListings = useQuery(api.listings.listActiveListings, { limit: 2 });
  const listings = useMemo<Listing[]>(
    () => convexListings?.map(fromConvexListing) ?? [],
    [convexListings]
  );

  return (
    <HeroPreviewShell>
      {convexListings === undefined ? <HeroPreviewSkeleton /> : null}
      {convexListings !== undefined && listings.length > 0 ? (
        <div className="mt-4 divide-y divide-ink/8 border-y border-ink/8">
          {listings.map((listing) => (
            <HeroPreviewListingRow key={listing.id} listing={listing} />
          ))}
        </div>
      ) : null}
      {convexListings !== undefined && listings.length === 0 ? <HeroPreviewIntro /> : null}
    </HeroPreviewShell>
  );
}

function HeroPreviewShell({ children }: { children: ReactNode }) {
  return (
    <aside className="hidden lg:block" aria-label="Pregled lokalnog oglasnika">
      <div className="rounded-xl border border-ink/10 bg-white/88 p-5 shadow-soft backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-mossDark/72">
              Lokalni feed
            </p>
            <h2 className="mt-1 text-2xl font-black leading-tight text-ink">
              Najnovije iz okolice
            </h2>
          </div>
          <Link
            href="/oglasi"
            className="focus-ring inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-moss/18 bg-field px-3 text-xs font-black text-mossDark transition hover:bg-moss hover:text-white"
          >
            Feed
            <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>

        {children}

        <div className="mt-4 border-t border-ink/8 pt-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/52">
            Pregledaj po tipu
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {categoryShortcuts.map((category) => {
              const Icon = category.icon;
              const meta = listingTypeMeta[category.type];

              return (
                <Link
                  key={category.type}
                  href={category.href}
                  className={`focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-black transition hover:-translate-y-0.5 hover:shadow-sm ${meta.badgeClassName}`}
                >
                  <Icon aria-hidden="true" size={16} />
                  {category.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-field/70 p-3 text-center text-xs font-black leading-snug text-ink/66">
          <span>Lokalno</span>
          <span>Direktan dogovor</span>
          <span>Bez provizije</span>
        </div>
      </div>
    </aside>
  );
}

function HeroPreviewListingRow({ listing }: { listing: Listing }) {
  const created = new Intl.DateTimeFormat("hr-HR", {
    day: "numeric",
    month: "short"
  }).format(new Date(listing.createdAt));
  const primaryImage = listing.imageUrls[0];
  const meta = listingTypeMeta[listing.type];

  return (
    <Link
      href={`/oglasi/${listing.id}`}
      className="focus-ring group grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 py-3 transition hover:bg-field/70"
    >
      <div className="grid aspect-square place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-moss/18 via-skywash to-honey/24">
        {primaryImage ? (
          <div
            role="img"
            aria-label={`Slika oglasa ${listing.title}`}
            className="h-full w-full bg-cover bg-center transition duration-300 group-hover:scale-[1.03]"
            style={{ backgroundImage: `url(${primaryImage})` }}
          />
        ) : (
          <Tag aria-hidden="true" size={24} className="text-mossDark" />
        )}
      </div>
      <div className="min-w-0 py-0.5">
        <div className="flex items-center gap-2 text-[11px] font-black">
          <span className={`rounded-full border px-2 py-0.5 ${meta.badgeClassName}`}>
            {meta.label}
          </span>
          <span className="shrink-0 text-ink/46">{created}</span>
        </div>
        <h3 className="mt-2 line-clamp-2 text-base font-black leading-snug text-ink">
          {listing.title}
        </h3>
        <div className="mt-1 flex items-center justify-between gap-2 text-sm font-black">
          <span className="truncate text-mossDark">{formatListingPrice(listing)}</span>
          <span className="shrink-0 text-xs text-ink/52">{listing.city}</span>
        </div>
      </div>
    </Link>
  );
}

function HeroPreviewIntro() {
  return (
    <div className="mt-4 rounded-lg bg-field/70 p-4">
      <h3 className="text-lg font-black leading-snug text-ink">
        Kreni od lokalnog feeda ili objavi prvi oglas.
      </h3>
      <p className="mt-2 text-sm font-bold leading-relaxed text-ink/64">
        Pregledaj ponudu po tipu oglasa ili dodaj stvar koju želiš prodati, pokloniti, zamijeniti ili pronaći.
      </p>
      <Link
        href="/novi-oglas"
        className="focus-ring mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
      >
        <Megaphone aria-hidden="true" size={16} />
        Objavi oglas
      </Link>
    </div>
  );
}

function HeroPreviewSkeleton() {
  return (
    <div className="mt-4 divide-y divide-ink/8 border-y border-ink/8" aria-label="Učitavanje najnovijih oglasa">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 py-3">
          <div className="aspect-square animate-pulse rounded-lg bg-field" />
          <div className="space-y-2 py-1">
            <div className="h-4 w-28 animate-pulse rounded-full bg-field" />
            <div className="h-5 w-full animate-pulse rounded-full bg-field" />
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-field" />
          </div>
        </div>
      ))}
    </div>
  );
}

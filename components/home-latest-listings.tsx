"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { ArrowRight, Megaphone } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { api } from "@/convex/_generated/api";
import { fromConvexListing, type Listing } from "@/lib/listings";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export function HomeLatestListings() {
  if (!hasConvexUrl) {
    return (
      <LatestListingsShell>
        <LatestListingsEmptyState />
      </LatestListingsShell>
    );
  }

  return <ConnectedHomeLatestListings />;
}

function ConnectedHomeLatestListings() {
  const convexListings = useQuery(api.listings.listActiveListings, { limit: 3 });
  const listings = useMemo<Listing[]>(
    () => convexListings?.map(fromConvexListing) ?? [],
    [convexListings]
  );

  return (
    <LatestListingsShell>
      {convexListings === undefined ? <LatestListingsSkeleton /> : null}
      {convexListings !== undefined && listings.length > 0 ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : null}
      {convexListings !== undefined && listings.length === 0 ? <LatestListingsEmptyState /> : null}
    </LatestListingsShell>
  );
}

function LatestListingsShell({ children }: { children: ReactNode }) {
  return (
    <section className="bg-[#fbfcf7] px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-black text-ink sm:text-3xl">
              Najnoviji oglasi u Novoj Gradiški
            </h2>
            <p className="mt-3 text-base font-bold leading-relaxed text-ink/66">
              Brzo pogledaj što je novo ili otvori cijeli lokalni feed.
            </p>
          </div>
          <Link
            href="/oglasi"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-moss/18 bg-white px-4 text-sm font-black text-mossDark transition hover:bg-moss hover:text-white"
          >
            Svi oglasi
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
        {children}
      </div>
    </section>
  );
}

function LatestListingsSkeleton() {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-3" aria-label="Učitavanje najnovijih oglasa">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
          <div className="aspect-[16/11] animate-pulse bg-field" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-24 animate-pulse rounded-full bg-field" />
            <div className="h-5 w-4/5 animate-pulse rounded-full bg-field" />
            <div className="h-4 w-full animate-pulse rounded-full bg-field" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-field" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LatestListingsEmptyState() {
  return (
    <div className="mt-6 rounded-lg border border-moss/16 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-black text-ink">Još nema aktivnih oglasa u blizini.</h3>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-relaxed text-ink/66">
            Budi prvi koji će objaviti nešto iz Nove Gradiške i okolice.
          </p>
        </div>
        <Link
          href="/novi-oglas"
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
        >
          <Megaphone aria-hidden="true" size={17} />
          Objavi prvi oglas
        </Link>
      </div>
    </div>
  );
}

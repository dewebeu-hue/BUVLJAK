"use client";

import { useQuery } from "convex/react";
import { ListingCard } from "@/components/listing-card";
import { api } from "@/convex/_generated/api";
import { demoListings, fromConvexListing, type Listing } from "@/lib/listings";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export function ListingsFeed() {
  if (!hasConvexUrl) {
    return <ListingsGrid listings={demoListings} />;
  }

  return <ConvexListingsFeed />;
}

function ConvexListingsFeed() {
  const listings = useQuery(api.listings.listActiveListings, {
    limit: 20
  });

  if (listings === undefined) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Oglasi se učitavaju">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-[33rem] animate-pulse rounded-lg border border-ink/10 bg-white shadow-sm"
          >
            <div className="aspect-[4/3] rounded-t-lg bg-ink/8" />
            <div className="space-y-4 p-4">
              <div className="h-7 w-28 rounded-full bg-ink/8" />
              <div className="h-7 w-4/5 rounded bg-ink/8" />
              <div className="h-11 rounded bg-ink/8" />
              <div className="h-11 rounded bg-ink/8" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-11 rounded-lg bg-ink/8" />
                <div className="h-11 rounded-lg bg-ink/8" />
                <div className="h-11 rounded-lg bg-ink/8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink/18 bg-white p-6 text-center">
        <h2 className="text-xl font-black text-ink">Još nema aktivnih oglasa</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/64">
          Prvi oglasi će se pojaviti ovdje čim ih netko objavi ili kad se pokrene demo seed.
        </p>
      </div>
    );
  }

  return <ListingsGrid listings={listings.map(fromConvexListing)} />;
}

function ListingsGrid({ listings }: { listings: Listing[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

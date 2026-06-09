"use client";

import { Show, SignInButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { CheckCircle2, Eye, Loader2, Pause, PlusCircle, UserRound } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  demoListings,
  formatPrice,
  fromConvexListing,
  listingStatusLabels,
  listingTypeLabels,
  type Listing,
  type ListingStatus
} from "@/lib/listings";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

const userDemoListings = demoListings.slice(0, 3);
type ConvexListing = Doc<"listings">;

export function MyListingsPanel() {
  return (
    <>
      <Show when="signed-out">
        <section className="mt-7 rounded-lg border border-honey/30 bg-honey/16 p-5">
          <div className="flex gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-mossDark">
              <UserRound aria-hidden="true" size={21} />
            </span>
            <div>
              <h2 className="text-xl font-black text-ink">Prijavi se za svoje oglase</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/68">
                Prijavi se da možeš objaviti i kasnije urediti svoj oglas.
              </p>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="focus-ring mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
                >
                  Prijava
                </button>
              </SignInButton>
            </div>
          </div>
        </section>
      </Show>

      <Show when="signed-in">
        {hasConvexUrl ? <ConnectedMyListings /> : <LocalMyListingsFallback />}
      </Show>
    </>
  );
}

function ConnectedMyListings() {
  const listings = useQuery(api.listings.listMyListings, {
    limit: 30
  });
  const updateListingStatus = useMutation(api.listings.updateListingStatus);

  async function updateStatus(id: string, status: ListingStatus) {
    await updateListingStatus({ id, status });
  }

  if (listings === undefined) {
    return (
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-56 animate-pulse rounded-lg border border-ink/10 bg-white" />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return <EmptyMyListings />;
  }

  return (
    <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(listings as ConvexListing[]).map((listing) => (
        <MyListingCard
          key={listing._id}
          listing={fromConvexListing(listing)}
          onPause={() => updateStatus(listing._id, "paused")}
          onResolve={() => updateStatus(listing._id, "resolved")}
        />
      ))}
    </section>
  );
}

function LocalMyListingsFallback() {
  return (
    <>
      <section className="mt-7 rounded-lg border border-honey/30 bg-honey/16 p-5">
        <h2 className="text-xl font-black text-ink">Convex još nije povezan</h2>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/68">
          Postavi `NEXT_PUBLIC_CONVEX_URL` da bi se ovdje prikazali stvarni korisnikovi oglasi.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-2xl font-black text-ink">Demo prikaz</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {userDemoListings.map((listing) => (
            <MyListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </>
  );
}

function EmptyMyListings() {
  return (
    <section className="mt-7 rounded-lg border border-dashed border-ink/18 bg-white p-6">
      <h2 className="text-xl font-black text-ink">Još nema tvojih oglasa</h2>
      <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/64">
        Kad objaviš prvi oglas, moći ćeš ga pronaći ovdje i pratiti njegov status.
      </p>
      <Link
        href="/novi-oglas"
        className="focus-ring mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
      >
        <PlusCircle aria-hidden="true" size={18} />
        Objavi prvi oglas
      </Link>
    </section>
  );
}

function MyListingCard({
  listing,
  onPause,
  onResolve
}: {
  listing: Listing;
  onPause?: () => Promise<void> | void;
  onResolve?: () => Promise<void> | void;
}) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-moss/18 bg-moss/10 px-3 py-1 text-xs font-black text-mossDark">
          {listingTypeLabels[listing.type]}
        </span>
        <span className="rounded-full border border-honey/24 bg-honey/18 px-3 py-1 text-xs font-black text-[#72520d]">
          {listingStatusLabels[listing.status]}
        </span>
      </div>
      <h2 className="mt-4 text-xl font-black leading-snug text-ink">{listing.title}</h2>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-relaxed text-ink/64">
        {listing.description}
      </p>
      <div className="mt-4 rounded-lg bg-field px-3 py-2 text-sm font-black text-ink">
        {listing.city} · {formatPrice(listing.price, listing.type)}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Link
          href="/oglasi/demo"
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-field"
        >
          <Eye aria-hidden="true" size={16} />
          Pregledaj
        </Link>
        <button
          type="button"
          onClick={onPause}
          disabled={!onPause || listing.status === "paused"}
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-field disabled:cursor-not-allowed disabled:text-ink/35"
        >
          {onPause ? <Pause aria-hidden="true" size={16} /> : <Loader2 aria-hidden="true" size={16} />}
          Pauziraj
        </button>
        <button
          type="button"
          onClick={onResolve}
          disabled={!onResolve || listing.status === "resolved"}
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-moss px-3 text-sm font-black text-white transition hover:bg-mossDark disabled:cursor-not-allowed disabled:bg-ink/30"
        >
          <CheckCircle2 aria-hidden="true" size={16} />
          Riješeno
        </button>
      </div>
    </article>
  );
}

"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { BookmarkCheck, Loader2, Search, Trash2 } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { useClientMounted } from "@/components/use-client-mounted";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { fromConvexListing, type Listing } from "@/lib/listings";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

type SavedListingItem = {
  id: Id<"savedListings">;
  savedAt: number;
  listing: Doc<"listings"> & {
    imageUrls?: string[];
    ownerDisplayName?: string;
    isOwner?: boolean;
  };
};

export function SavedListingsPanel() {
  const { isLoaded, isSignedIn } = useAuth();
  const isMounted = useClientMounted();

  if (!hasConvexUrl) {
    return (
      <section className="mt-8 rounded-lg border border-honey/30 bg-honey/16 p-5">
        <h2 className="text-xl font-black text-ink">Spremljeni oglasi traže povezanu bazu.</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/66">
          Kad je Convex povezan, ovdje će se prikazati oglasi koje spremiš za kasnije.
        </p>
      </section>
    );
  }

  if (!isMounted || !isLoaded) {
    return <SavedListingsSkeleton />;
  }

  if (!isSignedIn) {
    return <SignedOutState />;
  }

  return <ConnectedSavedListings />;
}

function ConnectedSavedListings() {
  const savedItems = useQuery(api.savedListings.listMySavedListings) as
    | SavedListingItem[]
    | undefined;
  const unsaveListing = useMutation(api.savedListings.unsaveListing);
  const [removingListingId, setRemovingListingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  async function handleRemove(listing: Listing) {
    setRemovingListingId(listing.id);
    setStatusMessage("");

    try {
      await unsaveListing({ listingId: listing.id as Id<"listings"> });
      setStatusMessage("Oglas je uklonjen iz spremljenih.");
    } catch {
      setStatusMessage("Nismo uspjeli ukloniti oglas. Pokušaj ponovno.");
    } finally {
      setRemovingListingId(null);
    }
  }

  if (savedItems === undefined) {
    return <SavedListingsSkeleton />;
  }

  if (savedItems.length === 0) {
    return <EmptySavedListingsState />;
  }

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-black text-ink/64">{savedItems.length} spremljenih oglasa</p>
        {statusMessage ? (
          <p className="text-sm font-black text-mossDark" aria-live="polite">
            {statusMessage}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {savedItems.map((item) => {
          const listing = fromConvexListing(item.listing);
          const isRemoving = removingListingId === listing.id;

          return (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-ink/8 bg-white px-3 py-2 text-xs font-bold text-ink/58">
                <span>Spremljeno {formatSavedDate(item.savedAt)}</span>
                <button
                  type="button"
                  disabled={isRemoving}
                  onClick={() => void handleRemove(listing)}
                  className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink/12 bg-white px-2.5 font-black text-ink transition hover:bg-field disabled:cursor-wait disabled:opacity-60"
                >
                  {isRemoving ? (
                    <Loader2 aria-hidden="true" size={14} className="animate-spin" />
                  ) : (
                    <Trash2 aria-hidden="true" size={14} />
                  )}
                  Ukloni
                </button>
              </div>
              <ListingCard listing={listing} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SignedOutState() {
  return (
    <section className="mt-8 rounded-lg border border-honey/30 bg-honey/16 p-5">
      <BookmarkCheck aria-hidden="true" size={28} className="text-mossDark" />
      <h2 className="mt-3 text-xl font-black text-ink">Prijavi se za spremljene oglase.</h2>
      <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/66">
        Prijavi se da možeš spremati oglase i kasnije ih pronaći na istom mjestu.
      </p>
      <SignInButton mode="modal" fallbackRedirectUrl="/spremljeni-oglasi" forceRedirectUrl="/spremljeni-oglasi">
        <button
          type="button"
          className="focus-ring mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
        >
          Prijavi se
        </button>
      </SignInButton>
    </section>
  );
}

function EmptySavedListingsState() {
  return (
    <section className="mt-8 rounded-lg border border-dashed border-ink/18 bg-white p-6 text-center">
      <BookmarkCheck aria-hidden="true" size={34} className="mx-auto text-mossDark" />
      <h2 className="mt-3 text-xl font-black text-ink">Još nemaš spremljenih oglasa.</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/64">
        Kad na oglasu klikneš “Spremi”, pojavit će se ovdje i ostati vezan uz tvoj profil.
      </p>
      <Link
        href="/oglasi"
        className="focus-ring mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
      >
        <Search aria-hidden="true" size={18} />
        Pogledaj oglase
      </Link>
    </section>
  );
}

function SavedListingsSkeleton() {
  return (
    <section
      className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Spremljeni oglasi se učitavaju"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-[36rem] animate-pulse rounded-lg border border-ink/10 bg-white shadow-sm">
          <div className="aspect-[4/3] rounded-t-lg bg-ink/8" />
          <div className="space-y-4 p-4">
            <div className="h-7 w-28 rounded-full bg-ink/8" />
            <div className="h-7 w-4/5 rounded bg-ink/8" />
            <div className="h-11 rounded bg-ink/8" />
            <div className="h-11 rounded bg-ink/8" />
          </div>
        </div>
      ))}
    </section>
  );
}

function formatSavedDate(savedAt: number) {
  return new Intl.DateTimeFormat("hr-HR", {
    day: "numeric",
    month: "short"
  }).format(new Date(savedAt));
}

"use client";

import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Loader2,
  Pause,
  PlusCircle,
  RotateCcw,
  Sparkles,
  Trash2,
  UserRound
} from "lucide-react";
import { FacebookAuthButton } from "@/components/facebook-auth-button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  adminListings,
  demoListings,
  formatListingStatus,
  formatListingPrice,
  fromConvexListing,
  listingStatusBadgeClassNames,
  listingStatusFilterOptions,
  listingTypeBadgeClassNames,
  listingTypeLabels,
  type Listing,
  type ListingStatus
} from "@/lib/listings";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

const userDemoListings: Listing[] = [
  demoListings[0],
  { ...demoListings[1], status: "paused" },
  { ...demoListings[2], status: "resolved" },
  { ...adminListings[6], status: "removed" }
];
type ConvexListingResult = Parameters<typeof fromConvexListing>[0];

export function MyListingsPanel() {
  const { isLoaded, isSignedIn } = useUser();
  const convexAuth = useConvexAuth();

  if (!isLoaded || convexAuth.isLoading) {
    return <MyListingsSkeleton />;
  }

  if (!isSignedIn) {
    return <MyListingsLoginRequired />;
  }

  if (!hasConvexUrl) {
    return <LocalMyListingsFallback />;
  }

  if (!convexAuth.isAuthenticated) {
    return <MyListingsAuthProblem />;
  }

  return <ConnectedMyListings />;
}

function MyListingsLoginRequired() {
  return (
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
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/sign-in"
              className="focus-ring inline-flex h-11 items-center justify-center rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
            >
              Prijava
            </Link>
            <FacebookAuthButton redirectUrlComplete="/moji-oglasi" />
          </div>
        </div>
      </div>
    </section>
  );
}

function MyListingsAuthProblem() {
  return (
    <section className="mt-7 rounded-lg border border-honey/30 bg-honey/16 p-5">
      <div className="flex gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-mossDark">
          <UserRound aria-hidden="true" size={21} />
        </span>
        <div>
          <h2 className="text-xl font-black text-ink">Oglasi trenutno nisu dostupni</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/68">
            Za ovu akciju moraš biti prijavljen/a.
          </p>
        </div>
      </div>
    </section>
  );
}

function MyListingsSkeleton() {
  return (
    <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-56 animate-pulse rounded-lg border border-ink/10 bg-white" />
      ))}
    </div>
  );
}

function ConnectedMyListings() {
  const [statusFilter, setStatusFilter] = useState<ListingStatus>("active");
  const [statusMessage, setStatusMessage] = useState("");
  const listings = useQuery(api.listings.listMyListings, {
    limit: 50
  });
  const monetizationSettings = useQuery(api.monetization.getMonetizationSettings);
  const updateListingStatus = useMutation(api.listings.updateListingStatus);
  const listingModels = useMemo<Listing[]>(
    () => ((listings ?? []) as ConvexListingResult[]).map((listing) => fromConvexListing(listing)),
    [listings]
  );
  const filteredListings = listingModels.filter((listing) => listing.status === statusFilter);
  const showFeaturedCta = Boolean(monetizationSettings?.featuredListingsEnabled);
  const paymentsEnabled = Boolean(monetizationSettings?.paymentsEnabled);

  async function updateStatus(id: string, status: ListingStatus) {
    setStatusMessage("");

    try {
      await updateListingStatus({
        id: id as Id<"listings">,
        status,
        ...(status === "removed" ? { removedReason: "Removed by owner" } : {})
      });
      setStatusMessage("Status oglasa je ažuriran.");
    } catch {
      setStatusMessage("Za ovu akciju moraš biti prijavljen/a.");
    }
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
    <>
      {statusMessage ? (
        <p className="mt-5 inline-flex items-center gap-2 text-sm font-black text-mossDark" aria-live="polite">
          <CheckCircle2 aria-hidden="true" size={17} />
          {statusMessage}
        </p>
      ) : null}
      <StatusFilterBar value={statusFilter} onChange={setStatusFilter} />
      {filteredListings.length > 0 ? (
        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing) => (
            <MyListingCard
              key={listing.id}
              listing={listing}
              onPause={() => updateStatus(listing.id, "paused")}
              onResolve={() => updateStatus(listing.id, "resolved")}
              onActivate={() => updateStatus(listing.id, "active")}
              onRemove={() => updateStatus(listing.id, "removed")}
              showFeaturedCta={showFeaturedCta}
              paymentsEnabled={paymentsEnabled}
            />
          ))}
        </section>
      ) : (
        <EmptyStatusState />
      )}
    </>
  );
}

function LocalMyListingsFallback() {
  const [statusFilter, setStatusFilter] = useState<ListingStatus>("active");
  const filteredListings = userDemoListings.filter((listing) => listing.status === statusFilter);

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
        <StatusFilterBar value={statusFilter} onChange={setStatusFilter} />
        {filteredListings.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <MyListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyStatusState />
        )}
      </section>
    </>
  );
}

function EmptyMyListings() {
  return (
    <section className="mt-7 rounded-lg border border-dashed border-ink/18 bg-white p-6">
      <h2 className="text-xl font-black text-ink">Još nisi objavio/la oglas.</h2>
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

function EmptyStatusState() {
  return (
    <section className="mt-5 rounded-lg border border-dashed border-ink/18 bg-white p-5">
      <h2 className="text-lg font-black text-ink">Nema oglasa u ovom statusu.</h2>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/64">
        Promijeni filter statusa ili objavi novi oglas.
      </p>
    </section>
  );
}

function StatusFilterBar({
  value,
  onChange
}: {
  value: ListingStatus;
  onChange: (status: ListingStatus) => void;
}) {
  return (
    <div className="mt-7 flex gap-2 overflow-x-auto pb-1" aria-label="Filter statusa oglasa">
      {listingStatusFilterOptions.map((filter) => {
        const isActive = filter.value === value;

        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            className={`focus-ring h-10 shrink-0 rounded-full border px-4 text-sm font-black transition ${
              isActive
                ? "border-moss bg-moss text-white"
                : "border-ink/12 bg-white text-ink/70 hover:bg-field"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

function MyListingCard({
  listing,
  onPause,
  onResolve,
  onActivate,
  onRemove,
  showFeaturedCta = false,
  paymentsEnabled = false
}: {
  listing: Listing;
  onPause?: () => Promise<void> | void;
  onResolve?: () => Promise<void> | void;
  onActivate?: () => Promise<void> | void;
  onRemove?: () => Promise<void> | void;
  showFeaturedCta?: boolean;
  paymentsEnabled?: boolean;
}) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${listingTypeBadgeClassNames[listing.type]}`}>
          {listingTypeLabels[listing.type]}
        </span>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${listingStatusBadgeClassNames[listing.status]}`}>
          {formatListingStatus(listing.status)}
        </span>
      </div>
      <h2 className="mt-4 text-xl font-black leading-snug text-ink">{listing.title}</h2>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-relaxed text-ink/64">
        {listing.description}
      </p>
      <div className="mt-4 rounded-lg bg-field px-3 py-2 text-sm font-black text-ink">
        {listing.city} · {formatListingPrice(listing)}
      </div>
      {showFeaturedCta && listing.status === "active" ? (
        <div className="mt-4 rounded-lg border border-honey/32 bg-honey/14 p-3">
          <div className="flex items-start gap-2">
            <Sparkles aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-[#72520d]" />
            <div>
              <p className="text-sm font-black text-ink">Istakni oglas</p>
              <p className="mt-1 text-xs font-bold leading-relaxed text-ink/62">
                {paymentsEnabled
                  ? "Plaćanje još nije spojeno."
                  : "Kontaktiraj admina za beta isticanje."}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Link
          href={`/oglasi/${listing.id}`}
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-field"
        >
          <Eye aria-hidden="true" size={16} />
          Pregledaj
        </Link>
        {listing.status === "paused" ? (
          <button
            type="button"
            onClick={onActivate}
            disabled={!onActivate}
            className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-moss px-3 text-sm font-black text-white transition hover:bg-mossDark disabled:cursor-not-allowed disabled:bg-ink/30"
          >
            <RotateCcw aria-hidden="true" size={16} />
            Aktiviraj
          </button>
        ) : null}
        <button
          type="button"
          onClick={onPause}
          disabled={!onPause || listing.status !== "active"}
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
        <button
          type="button"
          onClick={onRemove}
          disabled={!onRemove || listing.status === "removed"}
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-clay/20 bg-clay/8 px-3 text-sm font-black text-clay transition hover:bg-clay/12 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Trash2 aria-hidden="true" size={16} />
          Ukloni
        </button>
      </div>
    </article>
  );
}

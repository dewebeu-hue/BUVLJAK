"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Bookmark, Eye, Handshake, MapPin, Share2, Sparkles, Tag } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  actionLabelForListing,
  formatListingStatus,
  formatListingPrice,
  Listing,
  listingStatusBadgeClassNames,
  listingTypeMeta
} from "@/lib/listings";
import { getPublicListingUrl } from "@/lib/public-urls";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

const visualTone: Record<Listing["type"], string> = {
  sell: "from-moss/28 via-skywash to-honey/28",
  give: "from-honey/38 via-field to-moss/18",
  swap: "from-plum/24 via-skywash to-honey/30",
  want: "from-clay/24 via-field to-skywash"
};

const primaryActionTone: Record<Listing["type"], string> = {
  sell: "bg-moss text-white hover:bg-mossDark",
  give: "bg-honey text-ink hover:bg-[#ffd45f]",
  swap: "bg-plum text-white hover:bg-[#6d35d5]",
  want: "bg-clay text-white hover:bg-[#bd4c31]"
};

export function ListingCard({
  listing,
  showFeatured = false
}: {
  listing: Listing;
  showFeatured?: boolean;
}) {
  if (hasConvexUrl && listing.isPersisted) {
    return <ConnectedListingCard listing={listing} showFeatured={showFeatured} />;
  }

  return <LocalListingCard listing={listing} showFeatured={showFeatured} />;
}

function ConnectedListingCard({
  listing,
  showFeatured
}: {
  listing: Listing;
  showFeatured: boolean;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const listingId = listing.id as Id<"listings">;
  const isSaved = useQuery(
    api.savedListings.isListingSaved,
    isSignedIn ? { listingId } : "skip"
  );
  const saveListing = useMutation(api.savedListings.saveListing);
  const unsaveListing = useMutation(api.savedListings.unsaveListing);
  const incrementShareCount = useMutation(api.listings.incrementShareCount);
  const [saveCount, setSaveCount] = useState(listing.saveCount);
  const [shareCount, setShareCount] = useState(listing.shareCount);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setStatusMessage("Prijavi se da možeš spremiti oglas.");
      openSignIn();
      return;
    }

    setIsSaving(true);
    setStatusMessage("");

    try {
      const result = isSaved
        ? await unsaveListing({ listingId })
        : await saveListing({ listingId });

      setSaveCount(result.saveCount);
      setStatusMessage(result.saved ? "Oglas spremljen." : "Oglas uklonjen iz spremljenih.");
    } catch {
      setStatusMessage("Spremanje oglasa trenutno nije uspjelo. Pokušaj ponovno.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleShare() {
    const shareResult = await shareListing(listing);

    if (!shareResult) {
      setStatusMessage("Dijeljenje je prekinuto.");
      return;
    }

    setStatusMessage(shareResult === "copied" ? "Link je kopiran." : "Podijeljeno.");
    setShareCount((current) => current + 1);
    await incrementShareCount({ id: listing.id as Id<"listings"> });
  }

  return (
    <ListingCardSurface
      listing={listing}
      saveCount={saveCount}
      shareCount={shareCount}
      statusMessage={statusMessage}
      onSave={handleSave}
      onShare={handleShare}
      isSaved={Boolean(isSaved)}
      isSaving={isSaving}
      showFeatured={showFeatured}
    />
  );
}

function LocalListingCard({
  listing,
  showFeatured
}: {
  listing: Listing;
  showFeatured: boolean;
}) {
  const [saveCount] = useState(listing.saveCount);
  const [shareCount, setShareCount] = useState(listing.shareCount);
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSave() {
    setStatusMessage("Prijavi se da možeš spremiti oglas.");
  }

  async function handleShare() {
    const shareResult = await shareListing(listing);

    if (!shareResult) {
      setStatusMessage("Dijeljenje je prekinuto.");
      return;
    }

    setStatusMessage(shareResult === "copied" ? "Link je kopiran." : "Podijeljeno.");
    setShareCount((current) => current + 1);
  }

  return (
    <ListingCardSurface
      listing={listing}
      saveCount={saveCount}
      shareCount={shareCount}
      statusMessage={statusMessage}
      onSave={handleSave}
      onShare={handleShare}
      isSaved={false}
      isSaving={false}
      showFeatured={showFeatured}
    />
  );
}

function ListingCardSurface({
  listing,
  saveCount,
  shareCount,
  statusMessage,
  onSave,
  onShare,
  isSaved,
  isSaving,
  showFeatured
}: {
  listing: Listing;
  saveCount: number;
  shareCount: number;
  statusMessage: string;
  onSave: () => void | Promise<void>;
  onShare: () => void | Promise<void>;
  isSaved: boolean;
  isSaving: boolean;
  showFeatured: boolean;
}) {
  const created = new Intl.DateTimeFormat("hr-HR", {
    day: "numeric",
    month: "short"
  }).format(new Date(listing.createdAt));
  const primaryImage = listing.imageUrls[0];
  const detailsHref = `/oglasi/${listing.id}`;
  const typeMeta = listingTypeMeta[listing.type];
  const priceLabel = formatListingPrice(listing);
  const primaryActionLabel = actionLabelForListing(listing);
  const statusLabel = formatListingStatus(listing.status);

  return (
    <article className="group overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-moss/18 hover:shadow-soft">
      <Link href={detailsHref} className="focus-ring block overflow-hidden">
        <div className={`relative grid aspect-[16/11] place-items-center bg-gradient-to-br ${visualTone[listing.type]}`}>
          {primaryImage ? (
            <div
              role="img"
              aria-label={`Slika oglasa ${listing.title}`}
              className="h-full w-full bg-cover bg-center transition duration-300 group-hover:scale-[1.02]"
              style={{ backgroundImage: `url(${primaryImage})` }}
            />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-xl border border-white/70 bg-white/78 text-mossDark shadow-sm">
              <Tag aria-hidden="true" size={34} strokeWidth={1.9} />
            </div>
          )}
          {showFeatured && listing.isFeatured ? (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-honey/35 bg-white/95 px-3 py-1 text-xs font-black text-[#72520d] shadow-sm">
              <Sparkles aria-hidden="true" size={14} />
              {listing.featuredLabel ?? "Istaknuto"}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-black">
          <span className={`rounded-full border px-2.5 py-1 ${typeMeta.badgeClassName}`}>
            {typeMeta.label}
          </span>
          <span className={`rounded-full border px-2.5 py-1 ${listingStatusBadgeClassNames[listing.status]}`}>
            {statusLabel}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs font-bold text-ink/58">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin aria-hidden="true" size={15} className="shrink-0 text-moss" />
            <span className="truncate">{listing.city}</span>
          </span>
          <time dateTime={listing.createdAt} className="shrink-0">
            {created}
          </time>
        </div>

        <div className="space-y-3">
          <h2 className="line-clamp-2 text-xl font-black leading-snug text-ink">{listing.title}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-10 items-center rounded-xl bg-field px-3 py-2 text-lg font-black leading-none text-ink">
              {priceLabel}
            </span>
            <span className="inline-flex min-h-10 items-center rounded-xl border border-ink/8 bg-white px-3 py-2 text-sm font-bold leading-none text-ink/60">
              {listing.category}
            </span>
          </div>
          <p className="line-clamp-2 min-h-10 text-sm leading-relaxed text-ink/68">
            {listing.description}
          </p>
        </div>

        <div className="grid gap-2">
          <Link
            href={`${detailsHref}#akcija`}
            aria-label={primaryActionLabel}
            className={`focus-ring listing-card-primary-action inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black shadow-sm transition ${primaryActionTone[listing.type]}`}
          >
            <Handshake aria-hidden="true" size={16} />
            <span className="truncate">{primaryActionLabel}</span>
          </Link>
          <div className="listing-card-secondary-actions grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Sekundarne akcije oglasa">
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className={`focus-ring inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-black transition disabled:cursor-wait disabled:opacity-70 ${
                isSaved
                  ? "border-moss/20 bg-moss/8 text-mossDark hover:bg-moss/12"
                  : "border-ink/12 bg-white text-ink hover:bg-field"
              }`}
            >
              <Bookmark aria-hidden="true" size={15} fill={isSaved ? "currentColor" : "none"} />
              {isSaving ? "..." : isSaved ? "Spremljeno" : "Spremi"}
            </button>
            <button
              type="button"
              onClick={onShare}
              className="focus-ring inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-ink/12 bg-white px-2 text-xs font-black text-ink transition hover:bg-field"
            >
              <Share2 aria-hidden="true" size={15} />
              Podijeli
            </button>
            <Link
              href={detailsHref}
              className="focus-ring col-span-2 inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-ink/12 bg-white px-2 text-xs font-black text-ink transition hover:bg-field sm:col-span-1"
            >
              <Tag aria-hidden="true" size={15} />
              Detalji
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-lg bg-field/55 px-3 py-2 text-xs font-bold text-ink/50" aria-label="Metrike oglasa">
          <span className="inline-flex items-center gap-1">
            <Eye aria-hidden="true" size={14} />
            {listing.viewCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bookmark aria-hidden="true" size={14} />
            {saveCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Share2 aria-hidden="true" size={14} />
            {shareCount}
          </span>
        </div>

        <p className="min-h-4 text-xs font-bold text-mossDark" aria-live="polite">
          {statusMessage}
        </p>
      </div>
    </article>
  );
}

async function shareListing(listing: Listing) {
  const shareUrl = getPublicListingUrl(listing.id);
  const nav = typeof window !== "undefined" ? window.navigator : undefined;

  try {
    if (nav?.share) {
      await nav.share({
        title: listing.title,
        text: `${listing.title} - Buvljak`,
        url: shareUrl
      });
      return "shared";
    } else if (nav?.clipboard) {
      await nav.clipboard.writeText(shareUrl);
      return "copied";
    }
  } catch {
    return false;
  }

  return false;
}

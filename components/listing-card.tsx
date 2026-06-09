"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "convex/react";
import { Bookmark, Eye, Handshake, MapPin, Send, Share2, Tag } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  actionLabelForListing,
  formatListingPrice,
  Listing,
  listingStatusLabels,
  listingTypeLabels,
  ListingType
} from "@/lib/listings";
import { getPublicListingUrl } from "@/lib/public-urls";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

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
  if (hasConvexUrl && listing.isPersisted) {
    return <ConnectedListingCard listing={listing} />;
  }

  return <LocalListingCard listing={listing} />;
}

function ConnectedListingCard({ listing }: { listing: Listing }) {
  const incrementSaveCount = useMutation(api.listings.incrementSaveCount);
  const incrementShareCount = useMutation(api.listings.incrementShareCount);
  const [saveCount, setSaveCount] = useState(listing.saveCount);
  const [shareCount, setShareCount] = useState(listing.shareCount);
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSave() {
    setSaveCount((current) => current + 1);
    setStatusMessage("Oglas spremljen.");
    await incrementSaveCount({ id: listing.id as Id<"listings"> });
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
    />
  );
}

function LocalListingCard({ listing }: { listing: Listing }) {
  const [saveCount, setSaveCount] = useState(listing.saveCount);
  const [shareCount, setShareCount] = useState(listing.shareCount);
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSave() {
    setSaveCount((current) => current + 1);
    setStatusMessage("Oglas spremljen.");
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
    />
  );
}

function ListingCardSurface({
  listing,
  saveCount,
  shareCount,
  statusMessage,
  onSave,
  onShare
}: {
  listing: Listing;
  saveCount: number;
  shareCount: number;
  statusMessage: string;
  onSave: () => void;
  onShare: () => void;
}) {
  const created = new Intl.DateTimeFormat("hr-HR", {
    day: "numeric",
    month: "short"
  }).format(new Date(listing.createdAt));
  const primaryImage = listing.imageUrls[0];
  const detailsHref = `/oglasi/${listing.id}`;

  return (
    <article className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link href={detailsHref} className="focus-ring block">
        <div className={`relative grid aspect-[4/3] place-items-center bg-gradient-to-br ${visualTone[listing.type]}`}>
          {primaryImage ? (
            <div
              role="img"
              aria-label={`Slika oglasa ${listing.title}`}
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${primaryImage})` }}
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-lg border border-white/70 bg-white/70 text-mossDark shadow-sm">
              <Tag aria-hidden="true" size={32} strokeWidth={1.9} />
            </div>
          )}
        </div>
      </Link>

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
            <span className="text-right font-black">{formatListingPrice(listing)}</span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-lg border border-ink/8 bg-field/70 px-3 py-2 text-xs font-bold text-ink/58">
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

        <div className="flex items-center justify-between text-xs font-bold text-ink/52">
          <span>Najnovije</span>
          <time dateTime={listing.createdAt}>{created}</time>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={detailsHref}
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-3 text-sm font-black text-white transition hover:bg-mossDark"
          >
            <Tag aria-hidden="true" size={16} />
            Detalji
          </Link>
          <Link
            href={`${detailsHref}#akcija`}
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-moss/16 bg-moss/8 px-3 text-sm font-black text-mossDark transition hover:bg-moss/12"
          >
            <Handshake aria-hidden="true" size={16} />
            <span className="truncate">{actionLabelForListing(listing)}</span>
          </Link>
          <button
            type="button"
            onClick={onSave}
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-field"
          >
            <Bookmark aria-hidden="true" size={16} />
            Spremi
          </button>
          <button
            type="button"
            onClick={onShare}
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-field"
          >
            <Send aria-hidden="true" size={16} />
            Podijeli
          </button>
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

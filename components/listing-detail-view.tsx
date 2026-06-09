"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  Eye,
  Handshake,
  Loader2,
  MapPin,
  Pause,
  RotateCcw,
  Send,
  Share2,
  Tag,
  Trash2
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { FacebookPostComposer } from "@/components/facebook-post-composer";
import { useClientMounted } from "@/components/use-client-mounted";
import type { Id } from "@/convex/_generated/dataModel";
import {
  actionLabelForListing,
  contactMethodHint,
  demoListings,
  formatListingPrice,
  fromConvexListing,
  listingStatusLabels,
  listingTypeLabels,
  type Listing,
  type ListingStatus,
  type ListingType
} from "@/lib/listings";
import { getPublicListingUrl } from "@/lib/public-urls";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

const typeTone: Record<ListingType, string> = {
  sell: "border-moss/20 bg-moss/10 text-mossDark",
  give: "border-honey/30 bg-honey/16 text-[#72520d]",
  swap: "border-plum/20 bg-plum/10 text-plum",
  want: "border-clay/20 bg-clay/10 text-clay"
};

const reportReasons = [
  "Spam",
  "Prevara",
  "Neprimjeren sadržaj",
  "Oglas više nije aktualan",
  "Drugo"
];

type ContactIntent = "contact" | "availability" | "offer" | "pickup" | "swap" | "have_item";

type ContactResponse = {
  method: "whatsapp" | "email" | "facebook" | "none";
  redirectUrl?: string;
  emailSent?: boolean;
  displayMessage: string;
};

export function ListingDetailView({ listingId }: { listingId: string }) {
  const isMounted = useClientMounted();

  if (!hasConvexUrl) {
    return <LocalListingDetailView listingId={listingId} />;
  }

  if (!isMounted) {
    return <ListingDetailSkeleton />;
  }

  return <ConnectedListingDetailView listingId={listingId} />;
}

function ConnectedListingDetailView({ listingId }: { listingId: string }) {
  const convexListing = useQuery(
    api.listings.getListingById,
    { id: listingId as Id<"listings"> }
  );
  const incrementViewCount = useMutation(api.listings.incrementViewCount);
  const incrementSaveCount = useMutation(api.listings.incrementSaveCount);
  const incrementShareCount = useMutation(api.listings.incrementShareCount);
  const updateListingStatus = useMutation(api.listings.updateListingStatus);
  const createReport = useMutation(api.listings.createReport);
  const requestContactInfo = useAction(api.contact.requestContactInfo);
  const wasJustPublished =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("published") === "1";
  const publishedMessage = "Oglas je objavljen. Sada ga možeš kopirati u Facebook grupu.";

  const [metricOverrides, setMetricOverrides] = useState<
    Record<string, { saveCount?: number; shareCount?: number }>
  >({});
  const [statusMessage, setStatusMessage] = useState(wasJustPublished ? publishedMessage : "");
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [pendingContactIntent, setPendingContactIntent] = useState<ContactIntent | null>(null);
  const [selectedReportReason, setSelectedReportReason] = useState(reportReasons[0]);

  const listing = useMemo<Listing | null>(() => {
    return convexListing ? fromConvexListing(convexListing) : null;
  }, [convexListing]);

  const isLoading = hasConvexUrl && convexListing === undefined;
  const canPersist = Boolean(hasConvexUrl && listing?.isPersisted);

  useEffect(() => {
    if (!listing || !canPersist) {
      return;
    }

    const storageKey = `buvljak-viewed-${listing.id}`;

    try {
      if (window.sessionStorage.getItem(storageKey)) {
        return;
      }

      window.sessionStorage.setItem(storageKey, "1");
      void incrementViewCount({ id: listing.id as Id<"listings"> });
    } catch {
      void incrementViewCount({ id: listing.id as Id<"listings"> });
    }
  }, [canPersist, incrementViewCount, listing]);

  if (isLoading) {
    return <ListingDetailSkeleton />;
  }

  if (!listing) {
    return <MissingListingState />;
  }

  async function handleMetricAction(kind: "save" | "share") {
    if (!listing) {
      return;
    }

    if (kind === "save") {
      setMetricOverrides((current) => {
        const previous = current[listing.id] ?? {};
        return {
          ...current,
          [listing.id]: {
            ...previous,
            saveCount: (previous.saveCount ?? listing.saveCount) + 1
          }
        };
      });
      setStatusMessage("Oglas spremljen.");

      if (canPersist) {
        await incrementSaveCount({ id: listing.id as Id<"listings"> });
      }
      return;
    }

    const shareUrl = getPublicListingUrl(listing.id);
    const nav = typeof window !== "undefined" ? window.navigator : undefined;

    try {
      if (nav?.share) {
        await nav.share({
          title: listing.title,
          text: `${listing.title} - Buvljak`,
          url: shareUrl
        });
        setStatusMessage("Podijeljeno.");
      } else if (nav?.clipboard) {
        await nav.clipboard.writeText(shareUrl);
        setStatusMessage("Link je kopiran.");
      } else {
        setStatusMessage("Dijeljenje nije podržano u ovom pregledniku.");
        return;
      }
    } catch {
      setStatusMessage("Dijeljenje je prekinuto.");
      return;
    }

    setMetricOverrides((current) => {
      const previous = current[listing.id] ?? {};
      return {
        ...current,
        [listing.id]: {
          ...previous,
          shareCount: (previous.shareCount ?? listing.shareCount) + 1
        }
      };
    });

    if (canPersist) {
      await incrementShareCount({ id: listing.id as Id<"listings"> });
    }
  }

  function countFacebookPostShare() {
    if (!listing) {
      return;
    }

    setMetricOverrides((current) => {
      const previous = current[listing.id] ?? {};
      return {
        ...current,
        [listing.id]: {
          ...previous,
          shareCount: (previous.shareCount ?? listing.shareCount) + 1
        }
      };
    });
  }

  async function updateStatus(status: ListingStatus) {
    if (!listing || !canPersist) {
      return;
    }

    await updateListingStatus({
      id: listing.id as Id<"listings">,
      status,
      ...(status === "removed" ? { removedReason: "Removed by owner" } : {})
    });
    setStatusMessage("Status oglasa je ažuriran.");
  }

  async function submitReport() {
    if (!listing) {
      return;
    }

    if (canPersist) {
      await createReport({
        listingId: listing.id as Id<"listings">,
        reason: selectedReportReason
      });
    }

    setIsReportOpen(false);
    setStatusMessage("Prijava je zaprimljena.");
  }

  async function requestContact(
    intent: ContactIntent,
    options?: { offerAmount?: number; message?: string }
  ) {
    if (!listing || !canPersist) {
      setStatusMessage("Kontakt flow radi na stvarnim Convex oglasima.");
      return false;
    }

    setPendingContactIntent(intent);
    setStatusMessage("");

    try {
      const result = (await requestContactInfo({
        listingId: listing.id as Id<"listings">,
        source: "listing_page",
        intent,
        ...(options?.offerAmount !== undefined ? { offerAmount: options.offerAmount } : {}),
        ...(options?.message ? { message: options.message } : {})
      })) as ContactResponse;

      if (result.redirectUrl) {
        window.open(result.redirectUrl, "_blank", "noopener,noreferrer");
      }

      setStatusMessage(result.displayMessage);
      return Boolean(result.redirectUrl || result.emailSent);
    } catch {
      setStatusMessage("Kontakt trenutno nije dostupan. Pokušaj kasnije.");
      return false;
    } finally {
      setPendingContactIntent(null);
    }
  }

  const actionLabel = actionLabelForListing(listing);
  const metricOverride = metricOverrides[listing.id];
  const saveCount = metricOverride?.saveCount ?? listing.saveCount;
  const shareCount = metricOverride?.shareCount ?? listing.shareCount;
  const publishedDate = new Intl.DateTimeFormat("hr-HR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(listing.createdAt));
  const primaryImage = listing.imageUrls[0];

  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/oglasi"
          className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-black text-mossDark hover:text-moss"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Natrag na oglase
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <section className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
            <div className="relative grid aspect-[4/3] place-items-center bg-field">
              {primaryImage ? (
                <div
                  role="img"
                  aria-label={`Slika oglasa ${listing.title}`}
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${primaryImage})` }}
                />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-lg border border-ink/10 bg-white text-mossDark shadow-sm">
                  <Tag aria-hidden="true" size={38} strokeWidth={1.8} />
                </div>
              )}
            </div>

            {listing.imageUrls.length > 1 ? (
              <div className="grid grid-cols-5 gap-2 p-3">
                {listing.imageUrls.slice(0, 5).map((url, index) => (
                  <div
                    key={url}
                    role="img"
                    aria-label={`Slika ${index + 1} oglasa ${listing.title}`}
                    className="aspect-square rounded-lg bg-cover bg-center"
                    style={{ backgroundImage: `url(${url})` }}
                  />
                ))}
              </div>
            ) : null}
          </section>

          <section className="space-y-5">
            <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-black ${typeTone[listing.type]}`}>
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
                  {formatListingPrice(listing)}
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-field px-4 py-2 text-ink/74">
                  <MapPin aria-hidden="true" size={17} />
                  {listing.city}
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-field px-4 py-2 text-ink/74">
                  <Tag aria-hidden="true" size={17} />
                  {listing.category}
                </span>
              </div>

              <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-ink/70">
                {listing.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-lg border border-ink/10 bg-white p-3 text-sm font-black text-ink/64 shadow-sm">
              <span className="inline-flex items-center gap-2">
                <Eye aria-hidden="true" size={17} className="text-moss" />
                {listing.viewCount}
              </span>
              <span className="inline-flex items-center gap-2">
                <Bookmark aria-hidden="true" size={17} className="text-moss" />
                {saveCount}
              </span>
              <span className="inline-flex items-center gap-2">
                <Share2 aria-hidden="true" size={17} className="text-moss" />
                {shareCount}
              </span>
            </div>

            <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
              <dl className="grid gap-3 text-sm font-semibold text-ink/68 sm:grid-cols-2">
                <div>
                  <dt className="font-black text-ink">Objavljeno</dt>
                  <dd className="mt-1 inline-flex items-center gap-2">
                    <CalendarDays aria-hidden="true" size={16} />
                    {publishedDate}
                  </dd>
                </div>
                <div>
                  <dt className="font-black text-ink">Oglašivač</dt>
                  <dd className="mt-1">{listing.ownerDisplayName ?? "Korisnik Buvljaka"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-black text-ink">Kontakt metoda</dt>
                  <dd className="mt-1">{contactMethodHint(listing.contactMethod)}</dd>
                </div>
              </dl>
            </div>

            {listing.isOwner ? (
              <div className="rounded-lg border border-moss/16 bg-moss/8 p-4">
                <p className="font-black text-mossDark">Ovo je tvoj oglas.</p>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/64">
                  Kontakt gumbe ne prikazujemo vlasniku oglasa.
                </p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <ContactButton
                  loading={pendingContactIntent === "contact"}
                  icon={<Send aria-hidden="true" size={17} />}
                  label="Kontaktiraj oglašivača"
                  primary
                  onClick={() => requestContact("contact")}
                />
                <ContactButton
                  loading={pendingContactIntent === "availability"}
                  icon={<CheckCircle2 aria-hidden="true" size={17} />}
                  label="Pitaj je li još dostupno"
                  onClick={() => requestContact("availability")}
                />
                <ContactButton
                  id="akcija"
                  loading={pendingContactIntent === "pickup"}
                  icon={<Handshake aria-hidden="true" size={17} />}
                  label={actionLabel}
                  tone="soft"
                  onClick={() => {
                    if (listing.type === "give") {
                      void requestContact("pickup");
                      return;
                    }

                    setIsActionOpen((current) => !current);
                  }}
                />
              <button
                type="button"
                onClick={() => handleMetricAction("save")}
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-4 text-sm font-black text-ink transition hover:bg-field"
              >
                <Bookmark aria-hidden="true" size={17} />
                Spremi
              </button>
              <button
                type="button"
                onClick={() => handleMetricAction("share")}
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-4 text-sm font-black text-ink transition hover:bg-field"
              >
                <Share2 aria-hidden="true" size={17} />
                Podijeli
              </button>
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-clay/20 bg-clay/8 px-4 text-sm font-black text-clay transition hover:bg-clay/12"
              >
                <AlertTriangle aria-hidden="true" size={17} />
                Prijavi oglas
              </button>
              </div>
            )}

            {isActionOpen && !listing.isOwner ? (
              <ActionContactPanel
                listing={listing}
                offerAmount={offerAmount}
                offerMessage={offerMessage}
                onAmountChange={setOfferAmount}
                onMessageChange={setOfferMessage}
                loading={pendingContactIntent === "offer" || pendingContactIntent === "swap" || pendingContactIntent === "have_item"}
                onSubmit={async (intent, payload) => {
                  const sent = await requestContact(intent, payload);
                  if (sent) {
                    setIsActionOpen(false);
                  }
                }}
              />
            ) : null}

            {listing.isOwner ? (
              <OwnerActions listing={listing} canPersist={canPersist} onStatusChange={updateStatus} />
            ) : null}

            <p className="min-h-5 text-sm font-black text-mossDark" aria-live="polite">
              {statusMessage}
            </p>

            <FacebookPostComposer
              listing={listing}
              canPersist={canPersist}
              initialMessage={
                wasJustPublished ? publishedMessage : ""
              }
              onShareCounted={countFacebookPostShare}
            />

            <div className="rounded-lg border border-honey/30 bg-honey/16 p-4">
              <p className="font-bold leading-relaxed text-ink/76">
                Kontakt se u MVP-u odvija izvan aplikacije putem WhatsAppa, emaila ili Facebook
                linka. Nema internog chata.
              </p>
            </div>
          </section>
        </div>
      </div>

      {isReportOpen ? (
        <ReportDialog
          selectedReason={selectedReportReason}
          onSelectReason={setSelectedReportReason}
          onClose={() => setIsReportOpen(false)}
          onSubmit={submitReport}
        />
      ) : null}
    </main>
  );
}

function ContactButton({
  id,
  loading,
  icon,
  label,
  onClick,
  primary = false,
  tone = "plain"
}: {
  id?: string;
  loading: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  tone?: "plain" | "soft";
}) {
  const className = primary
    ? "bg-moss px-4 text-white hover:bg-mossDark"
    : tone === "soft"
      ? "border border-moss/18 bg-moss/8 px-4 text-mossDark hover:bg-moss/12"
      : "border border-ink/12 bg-white px-4 text-ink hover:bg-field";

  return (
    <button
      id={id}
      type="button"
      disabled={loading}
      onClick={onClick}
      className={`focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg text-sm font-black transition disabled:cursor-wait disabled:opacity-70 ${className}`}
    >
      {loading ? <Loader2 aria-hidden="true" className="animate-spin" size={17} /> : icon}
      {label}
    </button>
  );
}

function ActionContactPanel({
  listing,
  offerAmount,
  offerMessage,
  onAmountChange,
  onMessageChange,
  loading,
  onSubmit
}: {
  listing: Listing;
  offerAmount: string;
  offerMessage: string;
  onAmountChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  loading: boolean;
  onSubmit: (
    intent: ContactIntent,
    payload?: { offerAmount?: number; message?: string }
  ) => Promise<void>;
}) {
  const [error, setError] = useState("");
  const title = actionLabelForListing(listing);
  const isOffer = listing.type === "sell" && listing.allowOffers;
  const intent: ContactIntent =
    listing.type === "swap"
      ? "swap"
      : listing.type === "want"
        ? "have_item"
        : isOffer
          ? "offer"
          : "contact";
  const messageLabel =
    listing.type === "swap"
      ? "Što nudiš u zamjenu"
      : listing.type === "want"
        ? "Što imaš"
        : "Kratka poruka";
  const messagePlaceholder =
    listing.type === "swap"
      ? "Npr. nudim manji regal ili policu."
      : listing.type === "want"
        ? "Npr. imam stariji ispravan model, mogu poslati detalje."
        : "Napiši kratku poruku oglašivaču.";

  async function handleSubmit() {
    setError("");

    if (isOffer) {
      const amount = Number(offerAmount.replace(",", "."));
      if (!Number.isFinite(amount) || amount <= 0) {
        setError("Upiši iznos ponude.");
        return;
      }

      await onSubmit(intent, {
        offerAmount: amount,
        ...(offerMessage.trim() ? { message: offerMessage.trim() } : {})
      });
      return;
    }

    if ((intent === "swap" || intent === "have_item") && !offerMessage.trim()) {
      setError("Napiši kratku poruku prije slanja.");
      return;
    }

    await onSubmit(intent, offerMessage.trim() ? { message: offerMessage.trim() } : undefined);
  }

  return (
    <section className="rounded-lg border border-moss/18 bg-moss/8 p-5">
      <h2 className="text-xl font-black text-ink">{title}</h2>
      <div className="mt-4 grid gap-3">
        {isOffer ? (
          <label className="block">
            <span className="text-sm font-black text-ink">Iznos ponude</span>
            <input
              type="number"
              min={0}
              value={offerAmount}
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder="npr. 50"
              className="focus-ring mt-2 h-11 w-full rounded-lg border border-ink/12 bg-white px-3 text-sm font-bold text-ink"
            />
          </label>
        ) : null}
        <label className="block">
          <span className="text-sm font-black text-ink">{messageLabel}</span>
          <textarea
            value={offerMessage}
            onChange={(event) => onMessageChange(event.target.value)}
            placeholder={messagePlaceholder}
            className="focus-ring mt-2 min-h-28 w-full rounded-lg border border-ink/12 bg-white px-3 py-3 text-sm font-bold text-ink"
          />
        </label>
        {error ? (
          <p className="text-sm font-black text-clay" aria-live="polite">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? <Loader2 aria-hidden="true" className="animate-spin" size={17} /> : null}
          {title}
        </button>
      </div>
      <p className="mt-3 text-sm font-bold text-ink/64">
        Poruka ide kroz sigurni kontakt resolver, a dogovor se nastavlja izvan aplikacije.
      </p>
    </section>
  );
}

function OwnerActions({
  listing,
  canPersist,
  onStatusChange
}: {
  listing: Listing;
  canPersist: boolean;
  onStatusChange: (status: ListingStatus) => Promise<void>;
}) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-ink">Akcije vlasnika</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {listing.status === "paused" ? (
          <OwnerActionButton
            disabled={!canPersist}
            icon={<RotateCcw aria-hidden="true" size={17} />}
            label="Vrati u aktivno"
            onClick={() => onStatusChange("active")}
          />
        ) : (
          <OwnerActionButton
            disabled={!canPersist || listing.status !== "active"}
            icon={<Pause aria-hidden="true" size={17} />}
            label="Pauziraj oglas"
            onClick={() => onStatusChange("paused")}
          />
        )}
        <OwnerActionButton
          disabled={!canPersist || listing.status === "resolved"}
          icon={<CheckCircle2 aria-hidden="true" size={17} />}
          label="Označi kao riješeno"
          onClick={() => onStatusChange("resolved")}
        />
        <OwnerActionButton
          disabled={!canPersist || listing.status === "removed"}
          icon={<Trash2 aria-hidden="true" size={17} />}
          label="Ukloni oglas"
          onClick={() => onStatusChange("removed")}
          danger
        />
      </div>
    </section>
  );
}

function OwnerActionButton({
  disabled,
  icon,
  label,
  onClick,
  danger = false
}: {
  disabled: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${
        danger
          ? "border-clay/20 bg-clay/8 text-clay hover:bg-clay/12"
          : "border-ink/12 bg-white text-ink hover:bg-field"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ReportDialog({
  selectedReason,
  onSelectReason,
  onClose,
  onSubmit
}: {
  selectedReason: string;
  onSelectReason: (reason: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/42 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-soft">
        <h2 className="text-2xl font-black text-ink">Prijavi oglas</h2>
        <div className="mt-4 grid gap-2">
          {reportReasons.map((reason) => (
            <label
              key={reason}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-ink/10 bg-field px-3 py-3 text-sm font-black text-ink"
            >
              <input
                type="radio"
                name="reportReason"
                value={reason}
                checked={selectedReason === reason}
                onChange={() => onSelectReason(reason)}
                className="h-4 w-4"
              />
              {reason}
            </label>
          ))}
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring inline-flex h-11 items-center justify-center rounded-lg border border-ink/12 bg-white px-4 text-sm font-black text-ink transition hover:bg-field"
          >
            Odustani
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="focus-ring inline-flex h-11 items-center justify-center rounded-lg bg-clay px-4 text-sm font-black text-white transition hover:bg-[#bd4c31]"
          >
            Prijavi oglas
          </button>
        </div>
      </div>
    </div>
  );
}

function LocalListingDetailView({ listingId }: { listingId: string }) {
  const listing = demoListings.find((item) => item.id === listingId);

  if (!listing) {
    return <MissingListingState />;
  }

  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/oglasi"
          className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-black text-mossDark hover:text-moss"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Natrag na oglase
        </Link>

        <section className="mt-5 overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
          <div className="grid aspect-[4/3] place-items-center bg-field">
            <div className="grid h-24 w-24 place-items-center rounded-lg border border-ink/10 bg-white text-mossDark shadow-sm">
              <Tag aria-hidden="true" size={38} strokeWidth={1.8} />
            </div>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-sm font-black ${typeTone[listing.type]}`}>
                {listingTypeLabels[listing.type]}
              </span>
              <span className="rounded-full border border-honey/24 bg-honey/18 px-3 py-1 text-sm font-black text-[#72520d]">
                {listingStatusLabels[listing.status]}
              </span>
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight text-ink">{listing.title}</h1>
            <div className="mt-4 flex flex-wrap gap-3 text-base font-black">
              <span className="rounded-lg bg-moss px-4 py-2 text-white">
                {formatListingPrice(listing)}
              </span>
              <span className="rounded-lg bg-field px-4 py-2 text-ink/74">{listing.city}</span>
              <span className="rounded-lg bg-field px-4 py-2 text-ink/74">{listing.category}</span>
            </div>
            <p className="mt-5 text-base leading-relaxed text-ink/70">{listing.description}</p>
            <div className="mt-5 rounded-lg border border-honey/30 bg-honey/16 p-4">
              <p className="font-bold leading-relaxed text-ink/76">
                Ovo je demo prikaz dok Convex nije povezan. Kontakt flow i metrike rade na stvarnim
                Convex oglasima.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ListingDetailSkeleton() {
  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="aspect-[4/3] animate-pulse rounded-lg bg-ink/8" />
        <div className="space-y-4">
          <div className="h-10 animate-pulse rounded-lg bg-ink/8" />
          <div className="h-32 animate-pulse rounded-lg bg-ink/8" />
          <div className="h-48 animate-pulse rounded-lg bg-ink/8" />
        </div>
      </div>
    </main>
  );
}

function MissingListingState() {
  return (
    <main className="px-4 py-12 sm:px-6">
      <section className="mx-auto max-w-2xl rounded-lg border border-dashed border-ink/18 bg-white p-6 text-center">
        <h1 className="text-2xl font-black text-ink">Oglas nije pronađen ili više nije dostupan.</h1>
        <Link
          href="/oglasi"
          className="focus-ring mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
        >
          Natrag na oglase
        </Link>
      </section>
    </main>
  );
}

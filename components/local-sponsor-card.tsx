"use client";

import { ExternalLink, Store } from "lucide-react";

export type PublicLocalSponsor = {
  id: string;
  name: string;
  headline: string;
  body?: string;
  city?: string;
  category?: string;
  href?: string;
  imageUrl?: string;
  placement: "feed" | "listing_detail";
};

export function LocalSponsorStrip({
  sponsors,
  className = ""
}: {
  sponsors: PublicLocalSponsor[];
  className?: string;
}) {
  const sponsor = sponsors[0];

  if (!sponsor) {
    return null;
  }

  const content = (
    <div className="grid gap-4 rounded-lg border border-honey/32 bg-honey/14 p-4 shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-lg border border-white/70 bg-white text-mossDark">
        {sponsor.imageUrl ? (
          <div
            role="img"
            aria-label={sponsor.name}
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${sponsor.imageUrl})` }}
          />
        ) : (
          <Store aria-hidden="true" size={28} />
        )}
      </div>
      <div>
        <p className="text-xs font-black text-[#72520d]">
          Lokalni sponzor
        </p>
        <h2 className="mt-1 text-xl font-black leading-snug text-ink">{sponsor.headline}</h2>
        {sponsor.body ? (
          <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/66">{sponsor.body}</p>
        ) : null}
        <p className="mt-2 text-sm font-black text-ink/58">
          {[sponsor.name, sponsor.city, sponsor.category].filter(Boolean).join(" · ")}
        </p>
      </div>
      {sponsor.href ? (
        <span className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink">
          Pogledaj
          <ExternalLink aria-hidden="true" size={15} />
        </span>
      ) : null}
    </div>
  );

  return sponsor.href ? (
    <a
      href={sponsor.href}
      target="_blank"
      rel="noreferrer"
      className={`focus-ring block ${className}`}
    >
      {content}
    </a>
  ) : (
    <aside className={className}>{content}</aside>
  );
}

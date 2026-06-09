import { ImageResponse } from "next/og";
import {
  fallbackOgDescription,
  getOgDescription,
  getPublicListingPreview,
  getSharePriceText,
  type PublicListingPreview
} from "@/lib/public-listing-preview";
import { getPublicListingUrl } from "@/lib/public-urls";
import { listingTypeLabels } from "@/lib/listings";

export const dynamic = "force-dynamic";

const size = {
  width: 1200,
  height: 630
};

function shortText(value: string, maxLength: number) {
  const cleaned = value.replace(/\s+/g, " ").trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 1).trim()}...`;
}

function fallbackListing(id: string): PublicListingPreview {
  const now = Date.now();

  return {
    id,
    type: "sell",
    title: id === "default" ? "Buvljak" : "Oglas više nije dostupan",
    description: fallbackOgDescription,
    city: "Nova Gradiška",
    category: "Lokalni oglasi",
    priceType: "negotiable",
    status: "removed",
    allowOffers: false,
    images: [],
    imageUrls: [],
    viewCount: 0,
    shareCount: 0,
    saveCount: 0,
    createdAt: now,
    updatedAt: now
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listing = id === "default" ? null : await getPublicListingPreview(id);
  const safeListing = listing && listing.status !== "removed" ? listing : fallbackListing(id);
  const isFallback = !listing || listing.status === "removed" || id === "default";
  const imageUrl = !isFallback ? safeListing.imageUrls[0] : undefined;
  const priceText = isFallback
    ? "Nova Gradiška i okolica"
    : getSharePriceText(safeListing);
  const typeLabel = isFallback ? "Lokalni oglasi" : listingTypeLabels[safeListing.type];
  const description = isFallback
    ? "Prodajem, poklanjam, mijenjam i tražim u svojoj blizini."
    : getOgDescription(safeListing);
  const listingUrl = isFallback ? "buvljak.hr" : getPublicListingUrl(safeListing.id);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f8faf2",
          color: "#17201a",
          fontFamily: "Arial, sans-serif",
          padding: 46
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            border: "1px solid rgba(23,32,26,0.12)",
            borderRadius: 28,
            background: "#fffef8",
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(23,32,26,0.12)"
          }}
        >
          <div
            style={{
              width: 690,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "44px 46px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 62,
                  height: 62,
                  borderRadius: 18,
                  background: "#315d3f",
                  color: "#ffffff",
                  fontSize: 28,
                  fontWeight: 900
                }}
              >
                B
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: 0 }}>
                  Buvljak
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "rgba(23,32,26,0.62)" }}>
                  {safeListing.city} i okolica
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div
                  style={{
                    display: "flex",
                    borderRadius: 999,
                    background: "#e8f1df",
                    color: "#315d3f",
                    padding: "11px 18px",
                    fontSize: 22,
                    fontWeight: 900
                  }}
                >
                  {typeLabel}
                </div>
                <div
                  style={{
                    display: "flex",
                    borderRadius: 999,
                    background: "#ffe7a8",
                    color: "#5f4307",
                    padding: "11px 18px",
                    fontSize: 22,
                    fontWeight: 900
                  }}
                >
                  {priceText}
                </div>
              </div>

              <div
                style={{
                  fontSize: safeListing.title.length > 54 ? 48 : 58,
                  lineHeight: 1.05,
                  fontWeight: 900,
                  letterSpacing: 0
                }}
              >
                {shortText(safeListing.title, 82)}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  fontSize: 25,
                  lineHeight: 1.3,
                  color: "rgba(23,32,26,0.72)",
                  fontWeight: 700
                }}
              >
                <div>{shortText(description, 120)}</div>
                <div style={{ display: "flex", gap: 10, color: "#315d3f", fontWeight: 900 }}>
                  <span>{safeListing.city}</span>
                  <span>·</span>
                  <span>{safeListing.category}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "rgba(23,32,26,0.58)",
                fontSize: 20,
                fontWeight: 800
              }}
            >
              <span>Prodajem, poklanjam, mijenjam i tražim u blizini.</span>
              <span>{shortText(listingUrl.replace(/^https?:\/\//, ""), 34)}</span>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "stretch",
              justifyContent: "center",
              background: "#dcebd2",
              position: "relative"
            }}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 20,
                  background: "linear-gradient(135deg, #dcebd2 0%, #f7e5a6 100%)",
                  color: "#315d3f"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 170,
                    height: 170,
                    borderRadius: 36,
                    background: "rgba(255,255,255,0.72)",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(49,93,63,0.22)",
                    fontSize: 78,
                    fontWeight: 900
                  }}
                >
                  {safeListing.category.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>
                  {safeListing.category}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600"
      }
    }
  );
}

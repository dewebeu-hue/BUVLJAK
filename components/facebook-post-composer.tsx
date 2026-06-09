"use client";

import { useMemo, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { Copy, Loader2, RefreshCcw, Share2, Sparkles } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  generateFallbackFacebookPostText,
  type FacebookPostTone
} from "@/lib/facebook-post-text";
import type { Listing } from "@/lib/listings";
import { getPublicListingUrl } from "@/lib/public-urls";

type FacebookPostComposerProps = {
  listing: Listing;
  canPersist: boolean;
  initialMessage?: string;
  onShareCounted?: () => void;
};

export function FacebookPostComposer({
  listing,
  canPersist,
  initialMessage = "",
  onShareCounted
}: FacebookPostComposerProps) {
  const generateFacebookPostText = useAction(api.facebookPosts.generateFacebookPostText);
  const incrementShareCount = useMutation(api.listings.incrementShareCount);
  const fallbackText = useMemo(() => generateFallbackFacebookPostText(listing, "friendly"), [listing]);

  const [postText, setPostText] = useState(fallbackText);
  const [tone, setTone] = useState<FacebookPostTone>("friendly");
  const [message, setMessage] = useState(initialMessage);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  function refreshFallback(nextTone = tone) {
    setTone(nextTone);
    setPostText(generateFallbackFacebookPostText(listing, nextTone));
    setMessage("Tekst je spreman za kopiranje.");
  }

  async function registerShare() {
    onShareCounted?.();

    if (canPersist) {
      try {
        await incrementShareCount({ id: listing.id as Id<"listings"> });
      } catch {
        // Copy/share should stay successful even if the lightweight metric write fails.
      }
    }
  }

  async function improveWithAi() {
    setIsGenerating(true);
    setMessage("");

    try {
      const result = await generateFacebookPostText({
        listingId: listing.id as Id<"listings">,
        tone
      });

      setPostText(result.generatedText || generateFallbackFacebookPostText(listing, tone));
      setMessage(
        result.usedAi
          ? "Tekst je uređen pomoću AI-ja."
          : "AI nije dostupan, koristi se osnovni tekst."
      );
    } catch {
      setPostText(generateFallbackFacebookPostText(listing, tone));
      setMessage("AI nije dostupan, koristi se osnovni tekst.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyText() {
    try {
      if (!navigator.clipboard) {
        setMessage("Označi tekst i kopiraj ga ručno.");
        return;
      }

      await navigator.clipboard.writeText(postText);
      await registerShare();
      setMessage("Kopirano.");
    } catch {
      setMessage("Označi tekst i kopiraj ga ručno.");
    }
  }

  async function shareText() {
    setIsSharing(true);

    const shareUrl = getPublicListingUrl(listing.id);

    try {
      if (navigator.share) {
        await navigator.share({
          title: listing.title,
          text: postText,
          url: shareUrl
        });
        await registerShare();
        setMessage("Podijeljeno.");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(postText.includes(shareUrl) ? postText : `${postText}\n\nViše detalja: ${shareUrl}`);
        await registerShare();
        setMessage("Kopirano.");
      } else {
        setMessage("Označi tekst i kopiraj ga ručno.");
      }
    } catch {
      setMessage("Dijeljenje je prekinuto.");
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-ink">Tekst za Facebook grupu</h2>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/62">
            Kopiraj tekst za svoju lokalnu grupu. Buvljak ne objavljuje automatski i ne čita Facebook grupe.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-ink/10 bg-field p-1">
          {(["friendly", "simple", "short"] as FacebookPostTone[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => refreshFallback(option)}
              className={`focus-ring h-9 rounded-md px-3 text-xs font-black transition ${
                tone === option ? "bg-white text-mossDark shadow-sm" : "text-ink/58 hover:text-ink"
              }`}
            >
              {option === "friendly" ? "Toplo" : option === "simple" ? "Jednostavno" : "Kratko"}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-4 block">
        <span className="sr-only">Pregled teksta za Facebook grupu</span>
        <textarea
          value={postText}
          onChange={(event) => setPostText(event.target.value)}
          rows={9}
          className="focus-ring w-full resize-y rounded-lg border border-ink/12 bg-field px-4 py-3 text-sm font-semibold leading-relaxed text-ink"
        />
      </label>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => refreshFallback()}
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-4 text-sm font-black text-ink transition hover:bg-field"
        >
          <RefreshCcw aria-hidden="true" size={16} />
          Generiraj tekst
        </button>
        <button
          type="button"
          onClick={improveWithAi}
          disabled={isGenerating}
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-moss/18 bg-moss/8 px-4 text-sm font-black text-mossDark transition hover:bg-moss/12 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? <Loader2 aria-hidden="true" className="animate-spin" size={16} /> : <Sparkles aria-hidden="true" size={16} />}
          Uredi pomoću AI-ja
        </button>
        <button
          type="button"
          onClick={copyText}
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
        >
          <Copy aria-hidden="true" size={16} />
          Kopiraj za Facebook
        </button>
        <button
          type="button"
          onClick={shareText}
          disabled={isSharing}
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-4 text-sm font-black text-ink transition hover:bg-field disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSharing ? <Loader2 aria-hidden="true" className="animate-spin" size={16} /> : <Share2 aria-hidden="true" size={16} />}
          Podijeli
        </button>
      </div>

      <p className="mt-3 min-h-5 text-sm font-black text-mossDark" aria-live="polite">
        {message}
      </p>
    </section>
  );
}

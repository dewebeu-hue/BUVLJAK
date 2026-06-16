"use client";

import { useAction, useMutation } from "convex/react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Copy,
  ImagePlus,
  Loader2,
  PencilLine,
  Sparkles,
  X
} from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  formatImageBytes,
  isSupportedAiImage,
  uploadListingImageToConvexStorage
} from "@/lib/listing-images";
import type { ListingType } from "@/lib/listings";

const MAX_AI_IMAGES = 3;
const aiImageUploadErrorMessage = "Slike trenutno nije moguće pripremiti. Možeš nastaviti ručno.";
const aiSuggestionErrorMessage = "AI prijedlog trenutno nije moguće pripremiti. Možeš nastaviti ručno.";
const localAiContext = "Nova Gradiška i okolica";

type AssistantImageStatus = "ready" | "preparing" | "uploaded" | "error";
type AssistantState = "idle" | "uploading" | "analyzing" | "prepared";
type SuggestedCondition = "new" | "used" | "damaged" | "unknown";
type Confidence = "low" | "medium" | "high";
type CopyStatus = "idle" | "copied" | "failed";

type AssistantImage = {
  id: string;
  file: File;
  previewUrl: string;
  status: AssistantImageStatus;
  storageId?: Id<"_storage">;
  compressedSize?: number;
  error?: string;
};

export type AiListingDraftSuggestion = {
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedCategory: string;
  suggestedCondition: SuggestedCondition;
  priceLow: number | null;
  priceHigh: number | null;
  recommendedPrice: number | null;
  priceConfidence: Confidence;
  priceRationale: string;
  shouldAllowOffers: boolean;
  facebookText: string;
  warnings: string[];
  confidence: Confidence;
};

type AiListingAssistantProps = {
  listingType: ListingType;
  existingTitle?: string;
  existingDescription?: string;
  existingCategory?: string;
  onApplySuggestion: (suggestion: AiListingDraftSuggestion) => void;
  onManualContinue: () => void;
  isDisabled?: boolean;
};

const conditionLabels: Record<SuggestedCondition, string> = {
  new: "Novo",
  used: "Rabljeno",
  damaged: "Oštećeno",
  unknown: "Nije sigurno"
};

const confidenceLabels: Record<Confidence, string> = {
  low: "Niska sigurnost",
  medium: "Srednja sigurnost",
  high: "Visoka sigurnost"
};

function getImageStatusLabel(status: AssistantImageStatus) {
  if (status === "preparing") return "Priprema...";
  if (status === "error") return "Greška";
  return "Spremno";
}

function getImageStatusClassName(status: AssistantImageStatus) {
  if (status === "preparing") return "bg-honey/20 text-[#72520d]";
  if (status === "error") return "bg-clay/10 text-clay";
  return "bg-moss/10 text-mossDark";
}

function getConfidenceClassName(confidence: Confidence) {
  if (confidence === "high") return "bg-moss/10 text-mossDark";
  if (confidence === "medium") return "bg-honey/18 text-[#72520d]";
  return "bg-clay/8 text-clay";
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}

function optionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function getFriendlyAiError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("prijavljen")) {
    return "Za AI prijedlog moraš biti prijavljen. Možeš nastaviti ručno.";
  }

  if (normalizedMessage.includes("iskoristio/la besplatni ai prijedlog")) {
    return "Danas si iskoristio/la besplatni AI prijedlog. Oglas možeš nastaviti ručno.";
  }

  if (normalizedMessage.includes("iskoristio/la besplatne ai prijedloge")) {
    return "Ovaj tjedan si iskoristio/la besplatne AI prijedloge. Oglas možeš nastaviti ručno.";
  }

  if (normalizedMessage.includes("ai prijedlozi su danas iskorišteni")) {
    return "AI prijedlozi su danas iskorišteni. Oglas možeš nastaviti ručno.";
  }

  if (normalizedMessage.includes("1 do 3 slike")) {
    return "Dodaj 1 do 3 slike za AI prijedlog.";
  }

  if (normalizedMessage.includes("nije dostupan")) {
    return "AI prijedlog trenutno nije dostupan. Možeš nastaviti ručno.";
  }

  return aiSuggestionErrorMessage;
}

function getPriceSummary(suggestion: AiListingDraftSuggestion, listingType: ListingType) {
  if (listingType === "give") {
    return "Poklanjam";
  }

  if (listingType === "swap") {
    return "Mijenjam";
  }

  if (suggestion.priceConfidence === "low") {
    return listingType === "want" ? "Budžet po dogovoru" : "Cijena po dogovoru";
  }

  if (suggestion.priceLow !== null && suggestion.priceHigh !== null) {
    return `Okvirno ${formatEuro(suggestion.priceLow)} do ${formatEuro(suggestion.priceHigh)}`;
  }

  if (suggestion.recommendedPrice !== null) {
    return listingType === "want"
      ? `Budžet/prijedlog do ${formatEuro(suggestion.recommendedPrice)}`
      : `Prijedlog ${formatEuro(suggestion.recommendedPrice)}`;
  }

  return "AI nije dovoljno siguran za cijenu.";
}

function AiResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-field p-3">
      <dt className="text-xs font-black uppercase tracking-[0.1em] text-ink/45">{label}</dt>
      <dd className="mt-1 break-words text-sm font-black leading-relaxed text-ink">{value}</dd>
    </div>
  );
}

export function AiListingAssistant({
  listingType,
  existingTitle,
  existingDescription,
  existingCategory,
  onApplySuggestion,
  onManualContinue,
  isDisabled = false
}: AiListingAssistantProps) {
  const generateUploadUrl = useMutation(api.listings.generateListingImageUploadUrl);
  const analyzeListingImagesForDraft = useAction(api.aiListingAssistant.analyzeListingImagesForDraft);
  const [images, setImages] = useState<AssistantImage[]>([]);
  const [assistantState, setAssistantState] = useState<AssistantState>("idle");
  const [message, setMessage] = useState("");
  const [uploadedStorageIds, setUploadedStorageIds] = useState<Array<Id<"_storage">>>([]);
  const [draftSuggestion, setDraftSuggestion] = useState<AiListingDraftSuggestion | null>(null);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const imagesRef = useRef<AssistantImage[]>([]);
  const isWorking = assistantState === "uploading" || assistantState === "analyzing";

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  function resetSuggestionState() {
    setAssistantState("idle");
    setUploadedStorageIds([]);
    setDraftSuggestion(null);
    setCopyStatus("idle");
  }

  function handleImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const availableSlots = MAX_AI_IMAGES - images.length;
    const validImages = selectedFiles.filter(isSupportedAiImage);

    setMessage("");
    resetSuggestionState();

    if (selectedFiles.length === 0) {
      return;
    }

    if (availableSlots <= 0) {
      setMessage("Za AI prijedlog možeš dodati najviše 3 slike.");
      event.target.value = "";
      return;
    }

    if (validImages.length === 0) {
      setMessage("Podržane su JPG, PNG i WEBP slike.");
      event.target.value = "";
      return;
    }

    const nextImages = validImages.slice(0, availableSlots).map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "ready" as const
    }));

    setImages((current) => [...current, ...nextImages]);

    if (validImages.length > availableSlots || selectedFiles.length > availableSlots) {
      setMessage("Za AI prijedlog možeš dodati najviše 3 slike.");
    } else if (validImages.length !== selectedFiles.length) {
      setMessage("Podržane su JPG, PNG i WEBP slike.");
    }

    event.target.value = "";
  }

  function removeImage(id: string) {
    setImages((current) => {
      const image = current.find((item) => item.id === id);

      if (image) {
        URL.revokeObjectURL(image.previewUrl);
      }

      return current.filter((item) => item.id !== id);
    });

    setMessage("");
    resetSuggestionState();
  }

  async function handleSuggestClick() {
    if (images.length < 1) {
      setMessage("Dodaj barem jednu sliku predmeta prije AI prijedloga.");
      return;
    }

    if (images.length > MAX_AI_IMAGES) {
      setMessage("Za AI prijedlog možeš dodati najviše 3 slike.");
      return;
    }

    setDraftSuggestion(null);
    setCopyStatus("idle");
    setAssistantState("uploading");
    setMessage("Pripremamo slike za AI analizu.");
    setImages((current) =>
      current.map((image) => ({
        ...image,
        status: image.storageId ? "uploaded" : "preparing",
        error: undefined
      }))
    );

    const storageIds: Array<Id<"_storage">> = [];

    try {
      for (const image of images) {
        if (image.storageId) {
          storageIds.push(image.storageId);
          continue;
        }

        const upload = await uploadListingImageToConvexStorage({
          file: image.file,
          generateUploadUrl,
          prepareErrorMessage: aiImageUploadErrorMessage,
          uploadErrorMessage: aiImageUploadErrorMessage
        });
        const storageId = upload.storageId as Id<"_storage">;

        storageIds.push(storageId);

        setImages((current) =>
          current.map((item) =>
            item.id === image.id
              ? {
                  ...item,
                  status: "uploaded",
                  storageId,
                  compressedSize: upload.compressedSize
                }
              : item
          )
        );
      }

      setUploadedStorageIds(storageIds);
      setAssistantState("analyzing");
      setMessage("Analiziram predmet...");

      const existingTitleText = optionalText(existingTitle);
      const existingDescriptionText = optionalText(existingDescription);
      const existingCategoryText = optionalText(existingCategory);
      const suggestion = (await analyzeListingImagesForDraft({
        imageStorageIds: storageIds,
        listingType,
        ...(existingTitleText ? { existingTitle: existingTitleText } : {}),
        ...(existingDescriptionText ? { existingDescription: existingDescriptionText } : {}),
        ...(existingCategoryText ? { existingCategory: existingCategoryText } : {}),
        localContext: localAiContext
      })) as AiListingDraftSuggestion;

      setDraftSuggestion(suggestion);
      setAssistantState("prepared");
      setMessage("AI prijedlog je spreman. Provjeri ga prije primjene.");
    } catch (error) {
      setAssistantState("idle");
      setUploadedStorageIds(storageIds);
      setImages((current) =>
        current.map((image) =>
          image.status === "preparing"
            ? {
                ...image,
                status: "error",
                error: "Slika nije pripremljena."
              }
            : image
        )
      );
      setMessage(getFriendlyAiError(error));
    }
  }

  function handleApplySuggestion() {
    if (!draftSuggestion) {
      return;
    }

    onApplySuggestion(draftSuggestion);
  }

  async function handleCopyFacebookText() {
    if (!draftSuggestion?.facebookText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(draftSuggestion.facebookText);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <section className="rounded-xl border border-moss/14 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-moss/10 text-mossDark">
          <Sparkles aria-hidden="true" size={21} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-mossDark/72">
            AI pomoćnik
          </p>
          <h2 className="mt-1 text-xl font-black leading-tight text-ink sm:text-2xl">
            Slikaj predmet i predloži oglas
          </h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/68">
            Dodaj 1-3 fotografije predmeta. Slike ćemo smanjiti, analizirati i pripremiti prijedlog
            oglasa.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-honey/24 bg-honey/12 p-3 text-sm font-bold leading-relaxed text-ink/72">
        <p className="flex gap-2">
          <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0 text-[#72520d]" size={17} />
          <span>AI može pogriješiti. Prije objave provjeri opis, stanje i cijenu.</span>
        </p>
        <p className="mt-2 flex gap-2 text-xs leading-relaxed text-ink/62">
          <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0 text-[#72520d]" size={17} />
          <span>
            Ne šalji dokumente, lica, registracije, telefone, emailove ili druge privatne podatke.
          </span>
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        <label className="focus-ring flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-moss/38 bg-field px-4 text-center text-sm font-black text-mossDark transition hover:bg-moss/8">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            multiple
            className="sr-only"
            onChange={handleImagesChange}
            disabled={isDisabled || isWorking || images.length >= MAX_AI_IMAGES}
          />
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-moss/10">
            <Camera aria-hidden="true" size={20} />
          </span>
          <span>Slikaj ili dodaj slike predmeta</span>
          <span className="text-xs font-bold text-ink/52">
            JPG, PNG ili WEBP. Upload kreće tek kad klikneš Predloži oglas.
          </span>
        </label>

        {images.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {images.map((image) => (
              <div key={image.id} className="rounded-lg border border-ink/10 bg-white p-2 shadow-sm">
                <div className="relative overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.previewUrl} alt="" className="aspect-[4/3] w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="focus-ring absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-white/92 text-ink shadow-sm"
                    aria-label="Ukloni sliku za AI prijedlog"
                    disabled={isWorking}
                  >
                    <X aria-hidden="true" size={16} />
                  </button>
                </div>
                <div className="mt-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-ink/72">{image.file.name}</p>
                    <p className="mt-0.5 text-xs font-bold text-ink/50">
                      {formatImageBytes(image.file.size)}
                      {image.compressedSize ? ` -> ${formatImageBytes(image.compressedSize)}` : ""}
                    </p>
                    {image.error ? <p className="mt-1 text-xs font-black text-clay">{image.error}</p> : null}
                  </div>
                  <span
                    className={`inline-flex h-7 shrink-0 items-center rounded-full px-2 text-[11px] font-black ${getImageStatusClassName(
                      image.status
                    )}`}
                  >
                    {image.status === "preparing" ? (
                      <Loader2 aria-hidden="true" className="mr-1 animate-spin" size={12} />
                    ) : null}
                    {getImageStatusLabel(image.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {message ? (
        <div
          className="mt-4 flex gap-2 rounded-lg border border-ink/8 bg-white p-3 text-sm font-black text-ink/66"
          aria-live="polite"
        >
          {isWorking ? (
            <Loader2 aria-hidden="true" className="mt-0.5 shrink-0 animate-spin text-moss" size={17} />
          ) : assistantState === "prepared" ? (
            <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-mossDark" size={17} />
          ) : (
            <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0 text-clay" size={17} />
          )}
          <span>{message}</span>
        </div>
      ) : null}

      {draftSuggestion ? (
        <div className="mt-4 rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-ink">AI prijedlog oglasa</h3>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/62">
                Pregledaj prijedlog, pa ga primijeni u formu ako ti odgovara.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-black ${getConfidenceClassName(
                  draftSuggestion.confidence
                )}`}
              >
                {confidenceLabels[draftSuggestion.confidence]}
              </span>
              <span className="inline-flex h-8 items-center rounded-full bg-moss/10 px-3 text-xs font-black text-mossDark">
                {uploadedStorageIds.length} / {images.length} slika
              </span>
            </div>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <AiResultRow label="Naslov" value={draftSuggestion.suggestedTitle} />
            <AiResultRow label="Kategorija" value={draftSuggestion.suggestedCategory} />
            <AiResultRow label="Stanje" value={conditionLabels[draftSuggestion.suggestedCondition]} />
            <AiResultRow label="Cijena" value={getPriceSummary(draftSuggestion, listingType)} />
            <div className="rounded-lg bg-field p-3 sm:col-span-2">
              <dt className="text-xs font-black uppercase tracking-[0.1em] text-ink/45">Opis</dt>
              <dd className="mt-1 whitespace-pre-line break-words text-sm font-semibold leading-relaxed text-ink/72">
                {draftSuggestion.suggestedDescription}
              </dd>
            </div>
            <div className="rounded-lg bg-field p-3 sm:col-span-2">
              <dt className="text-xs font-black uppercase tracking-[0.1em] text-ink/45">
                Zašto ova cijena
              </dt>
              <dd className="mt-1 break-words text-sm font-semibold leading-relaxed text-ink/72">
                {draftSuggestion.priceRationale}
              </dd>
              <p className="mt-2 text-xs font-black text-ink/50">
                {confidenceLabels[draftSuggestion.priceConfidence]}
              </p>
            </div>
          </dl>

          <div className="mt-3 rounded-lg border border-honey/24 bg-honey/14 p-3 text-sm font-bold leading-relaxed text-ink/72">
            Ovo je okvirni AI prijedlog, ne službena procjena vrijednosti. Provjeri stanje i cijenu prije objave.
          </div>

          {draftSuggestion.warnings.length ? (
            <div className="mt-3 grid gap-2">
              {draftSuggestion.warnings.map((warning) => (
                <p
                  key={warning}
                  className="flex gap-2 rounded-lg border border-clay/14 bg-clay/6 p-3 text-sm font-bold leading-relaxed text-ink/70"
                >
                  <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0 text-clay" size={16} />
                  <span>{warning}</span>
                </p>
              ))}
            </div>
          ) : null}

          <div className="mt-4 rounded-lg border border-ink/10 bg-field p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-sm font-black text-ink">Tekst za Facebook grupu</h4>
              <button
                type="button"
                onClick={handleCopyFacebookText}
                className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-white/80"
              >
                <Copy aria-hidden="true" size={16} />
                Kopiraj tekst
              </button>
            </div>
            <div className="mt-3 whitespace-pre-line break-words rounded-lg bg-white p-3 text-sm font-semibold leading-relaxed text-ink/74">
              {draftSuggestion.facebookText}
            </div>
            {copyStatus === "copied" ? (
              <p className="mt-2 text-xs font-black text-mossDark">Tekst je kopiran.</p>
            ) : null}
            {copyStatus === "failed" ? (
              <p className="mt-2 text-xs font-black text-clay">
                Kopiranje nije uspjelo. Označi tekst i kopiraj ga ručno.
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleApplySuggestion}
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
            >
              <Sparkles aria-hidden="true" size={16} />
              Primijeni prijedlog
            </button>
            <button
              type="button"
              onClick={onManualContinue}
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-4 text-sm font-black text-ink transition hover:bg-field"
            >
              <PencilLine aria-hidden="true" size={16} />
              Uredi ručno
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleSuggestClick}
          disabled={isDisabled || isWorking}
          className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-moss px-5 text-base font-black text-white transition hover:bg-mossDark disabled:cursor-not-allowed disabled:bg-ink/30"
        >
          {isWorking ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={18} />
          ) : (
            <ImagePlus aria-hidden="true" size={18} />
          )}
          {assistantState === "uploading"
            ? "Pripremam slike"
            : assistantState === "analyzing"
              ? "Analiziram predmet"
              : "Predloži oglas"}
        </button>
        <button
          type="button"
          onClick={onManualContinue}
          disabled={isDisabled || isWorking}
          className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-5 text-base font-black text-ink transition hover:bg-field disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PencilLine aria-hidden="true" size={18} />
          Preskoči AI i nastavi ručno
        </button>
      </div>
    </section>
  );
}

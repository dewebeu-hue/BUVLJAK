"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import imageCompression from "browser-image-compression";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  Send,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import {
  contactMethodLabels,
  listingTypeLabels,
  type ContactMethod,
  type ListingType,
  type PriceType
} from "@/lib/listings";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
const isDevelopment = process.env.NODE_ENV === "development";
const imageUploadPrepareErrorMessage =
  "Nismo uspjeli pripremiti upload slika. Provjeri prijavu i pokušaj ponovno.";

type SelectedImage = {
  id: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize?: number;
};

type FormState = {
  type: ListingType;
  title: string;
  description: string;
  city: string;
  category: string;
  price: string;
  priceType: PriceType;
  sourceFacebookUrl: string;
  contactMethod: ContactMethod;
  contactEmail: string;
  contactPhone: string;
  contactFacebookUrl: string;
};

type CreationMode = "manual" | "facebook";
type ClerkConvexTokenStatus = "checking" | "available" | "missing";

type ParsedImportDraft = {
  type: ListingType;
  title: string;
  description: string;
  city: string;
  category: string;
  price?: number;
  priceType: PriceType;
  allowOffers: boolean;
  confidence?: number;
  warnings?: string[];
  usedAi?: boolean;
};

const initialFormState: FormState = {
  type: "sell",
  title: "",
  description: "",
  city: "Nova Gradiška",
  category: "Namještaj",
  price: "",
  priceType: "negotiable",
  sourceFacebookUrl: "",
  contactMethod: "whatsapp",
  contactEmail: "",
  contactPhone: "",
  contactFacebookUrl: ""
};

const categories = ["Namještaj", "Djeca", "Dom", "Vrt i alat", "Kućanski aparati", "Ostalo"];

const listingTypeOptions: Array<{ value: ListingType; label: string }> = [
  { value: "sell", label: listingTypeLabels.sell },
  { value: "give", label: listingTypeLabels.give },
  { value: "swap", label: listingTypeLabels.swap },
  { value: "want", label: listingTypeLabels.want }
];

const contactOptions: Array<{ value: ContactMethod; label: string }> = [
  { value: "whatsapp", label: contactMethodLabels.whatsapp },
  { value: "email", label: contactMethodLabels.email },
  { value: "facebook", label: contactMethodLabels.facebook },
  { value: "none", label: "Bez kontakta, samo želim tekst za objavu" }
];

const priceTypeLabels: Record<PriceType, string> = {
  fixed: "Fiksna cijena",
  negotiable: "Može dogovor",
  free: "Poklanjam",
  swap: "Zamjena",
  wanted: "Tražim"
};

function defaultPriceType(type: ListingType): PriceType {
  if (type === "give") return "free";
  if (type === "swap") return "swap";
  if (type === "want") return "wanted";
  return "negotiable";
}

function allowOffersFor(type: ListingType, priceType: PriceType) {
  if (type === "give" || type === "want") return false;
  if (type === "swap") return true;
  return priceType === "fixed" || priceType === "negotiable";
}

function priceOptionsFor(type: ListingType): PriceType[] {
  if (type === "give") return ["free"];
  if (type === "swap") return ["swap"];
  if (type === "want") return ["wanted"];
  return ["fixed", "negotiable"];
}

function parsePrice(value: string) {
  if (!value.trim()) return undefined;
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  const price = Number(normalized);
  return Number.isFinite(price) ? price : undefined;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function NewListingForm() {
  if (!hasConvexUrl) {
    return (
      <div className="mt-6 rounded-lg border border-honey/30 bg-honey/16 p-5">
        <h2 className="text-xl font-black text-ink">Convex još nije povezan</h2>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/68">
          Za stvarno spremanje oglasa postavi `NEXT_PUBLIC_CONVEX_URL` i pokreni Convex dev.
        </p>
      </div>
    );
  }

  return <ConnectedNewListingForm />;
}

function ConnectedNewListingForm() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { isLoaded: isClerkLoaded, isSignedIn, user } = useUser();
  const convexAuth = useConvexAuth();
  const authDebug = useQuery(api.authDebug.getCurrentIdentity, isDevelopment ? {} : "skip");
  const parseImportedListingText = useAction(api.facebookImports.parseImportedListingText);
  const createListing = useMutation(api.listings.createListing);
  const generateUploadUrl = useMutation(api.listings.generateListingImageUploadUrl);
  const defaultEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const [creationMode, setCreationMode] = useState<CreationMode>("manual");
  const [isImportReview, setIsImportReview] = useState(false);
  const [importRawText, setImportRawText] = useState("");
  const [importFacebookUrl, setImportFacebookUrl] = useState("");
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importParserLabel, setImportParserLabel] = useState("");
  const [importParsedAt, setImportParsedAt] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isParsingImport, setIsParsingImport] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clerkConvexTokenStatus, setClerkConvexTokenStatus] =
    useState<ClerkConvexTokenStatus>("checking");

  const priceOptions = useMemo(() => priceOptionsFor(form.type), [form.type]);

  useEffect(() => {
    if (!isDevelopment) {
      return;
    }

    let isCancelled = false;

    void Promise.resolve().then(async () => {
      if (isCancelled || !isClerkLoaded) {
        return;
      }

      if (!isSignedIn) {
        if (!isCancelled) {
          setClerkConvexTokenStatus("missing");
        }
        return;
      }

      setClerkConvexTokenStatus("checking");

      try {
        const token = await getToken({ template: "convex" });
        if (!isCancelled) {
          setClerkConvexTokenStatus(token ? "available" : "missing");
        }
      } catch {
        if (!isCancelled) {
          setClerkConvexTokenStatus("missing");
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [getToken, isClerkLoaded, isSignedIn]);

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [images]);

  function updateForm<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function switchCreationMode(mode: CreationMode) {
    setCreationMode(mode);
    setError(null);
    setImportError(null);

    if (mode === "manual") {
      setIsImportReview(false);
      setImportWarnings([]);
      setImportParserLabel("");
      setImportParsedAt(null);
      setForm((current) => ({ ...current, sourceFacebookUrl: "" }));
    }
  }

  function handleTypeChange(type: ListingType) {
    setForm((current) => ({
      ...current,
      type,
      price: type === "give" || type === "swap" ? "" : current.price,
      priceType: defaultPriceType(type)
    }));
  }

  async function handleImportSubmit() {
    const rawText = importRawText.trim();
    const sourceFacebookUrl = importFacebookUrl.trim();

    setImportError(null);
    setError(null);

    if (!rawText && !sourceFacebookUrl) {
      setImportError("Zalijepi tekst oglasa ili unesi podatke ručno.");
      return;
    }

    if (!rawText && sourceFacebookUrl) {
      setImportError("Ne možemo automatski pročitati ovu Facebook objavu. Zalijepi tekst oglasa ispod.");
      return;
    }

    setIsParsingImport(true);

    try {
      const parsed = (await parseImportedListingText({
        rawText,
        ...(sourceFacebookUrl ? { sourceFacebookUrl } : {})
      })) as ParsedImportDraft;

      setForm((current) => ({
        ...current,
        type: parsed.type,
        title: parsed.title,
        description: parsed.description,
        city: parsed.city,
        category: categories.includes(parsed.category) ? parsed.category : "Ostalo",
        price: typeof parsed.price === "number" ? String(parsed.price) : "",
        priceType: parsed.priceType,
        sourceFacebookUrl,
        contactMethod: "none",
        contactEmail: "",
        contactPhone: "",
        contactFacebookUrl: sourceFacebookUrl
      }));
      setImportWarnings(parsed.warnings ?? []);
      setImportParserLabel(parsed.usedAi ? "AI parser je predložio polja." : "Fallback parser je predložio polja.");
      setImportParsedAt(Date.now());
      setIsImportReview(true);
    } catch {
      setImportError("Nismo uspjeli automatski strukturirati oglas. Možeš ga unijeti ručno.");
    } finally {
      setIsParsingImport(false);
    }
  }

  function returnToImportText() {
    setIsImportReview(false);
    setError(null);
  }

  function handleImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const availableSlots = 5 - images.length;
    const nextImages = files.slice(0, availableSlots).map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      originalSize: file.size,
      previewUrl: URL.createObjectURL(file)
    }));

    setImages((current) => [...current, ...nextImages]);
    event.target.value = "";
  }

  function removeImage(id: string) {
    setImages((current) => {
      const image = current.find((item) => item.id === id);
      if (image) URL.revokeObjectURL(image.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  function validate() {
    const price = parsePrice(form.price);
    const needsPrice = form.priceType === "fixed" || form.priceType === "negotiable";

    if (form.title.trim().length < 3) return "Naslov treba imati barem 3 znaka.";
    if (form.description.trim().length < 10) return "Opis treba imati barem 10 znakova.";
    if (!form.city.trim()) return "Grad je obavezan.";
    if (!form.category.trim()) return "Kategorija je obavezna.";
    if (needsPrice && price === undefined) return "Cijena je obavezna za ovu vrstu cijene.";
    if (images.length < 1) return "Dodaj barem jednu sliku.";
    if (images.length > 5) return "Možeš dodati najviše 5 slika.";
    if (form.contactMethod === "whatsapp" && !form.contactPhone.trim()) return "Upiši WhatsApp broj.";
    if (form.contactMethod === "email" && !(form.contactEmail.trim() || defaultEmail)) {
      return "Upiši email adresu.";
    }
    if (form.contactMethod === "facebook" && !form.contactFacebookUrl.trim()) {
      return "Upiši Facebook link.";
    }

    return null;
  }

  async function compressAndUploadImages() {
    const storageIds: string[] = [];

    for (const image of images) {
      const compressed = await imageCompression(image.file, {
        maxSizeMB: 0.45,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        initialQuality: 0.82
      });
      let uploadUrl: string;

      try {
        uploadUrl = await generateUploadUrl({});
      } catch {
        throw new Error(imageUploadPrepareErrorMessage);
      }

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": compressed.type || image.file.type || "image/jpeg" },
        body: compressed
      });

      if (!response.ok) {
        throw new Error("Upload slike nije uspio.");
      }

      const result = (await response.json()) as { storageId: string };
      storageIds.push(result.storageId);

      setImages((current) =>
        current.map((item) =>
          item.id === image.id ? { ...item, compressedSize: compressed.size } : item
        )
      );
    }

    return storageIds;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (convexAuth.isLoading) {
        throw new Error("Još provjeravamo prijavu. Pokušaj ponovno za trenutak.");
      }

      if (!convexAuth.isAuthenticated) {
        throw new Error("Prijavi se da možeš objaviti oglas.");
      }

      const price = parsePrice(form.price);
      const imageStorageIds = await compressAndUploadImages();

      const createdListingId = await createListing({
        type: form.type,
        title: form.title,
        description: form.description,
        city: form.city,
        category: form.category,
        ...(price !== undefined ? { price } : {}),
        priceType: form.priceType,
        contactMethod: form.contactMethod,
        ...(form.contactMethod === "email"
          ? { contactEmail: form.contactEmail.trim() || defaultEmail }
          : {}),
        ...(form.contactMethod === "whatsapp" ? { contactPhone: form.contactPhone } : {}),
        ...(form.contactMethod === "facebook" ? { contactFacebookUrl: form.contactFacebookUrl } : {}),
        allowOffers: allowOffersFor(form.type, form.priceType),
        images: imageStorageIds,
        importSource: isImportReview ? "facebook_text" : "manual",
        ...(isImportReview && form.sourceFacebookUrl.trim()
          ? { sourceFacebookUrl: form.sourceFacebookUrl.trim() }
          : {}),
        ...(isImportReview && importRawText.trim() ? { importedRawText: importRawText.trim() } : {}),
        ...(isImportReview && importParsedAt ? { importParsedAt } : {})
      });

      router.push(`/oglasi/${createdListingId}?published=1`);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Oglas nije spremljen.";
      const friendlyMessage = message.includes("Authentication is required")
        ? "Prijavi se da možeš objaviti oglas."
        : message;
      setError(friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-6 space-y-5">
      {isDevelopment ? (
        <div className="space-y-2 rounded-lg border border-ink/10 bg-field p-3 text-xs font-black text-ink/62">
          <div>
            <span>Clerk auth: {isClerkLoaded && isSignedIn ? "signed in" : "signed out"}</span>
            <span className="mx-2 text-ink/30">|</span>
            <span>Clerk Convex token: {clerkConvexTokenStatus}</span>
            <span className="mx-2 text-ink/30">|</span>
            <span>
              Convex auth:{" "}
              {authDebug === undefined || convexAuth.isLoading
                ? "checking"
                : authDebug.isAuthenticated && convexAuth.isAuthenticated
                  ? "connected"
                  : "missing"}
            </span>
          </div>
          {isSignedIn && clerkConvexTokenStatus === "missing" ? (
            <p>Clerk JWT template named &apos;convex&apos; is missing or not issuing tokens.</p>
          ) : null}
          {clerkConvexTokenStatus === "available" && !convexAuth.isLoading && !convexAuth.isAuthenticated ? (
            <p>
              Convex auth config/env is not active. Check npx convex dev and CLERK_JWT_ISSUER_DOMAIN in Convex env.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-lg border border-ink/10 bg-white p-2 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => switchCreationMode("manual")}
            className={`focus-ring flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition ${
              creationMode === "manual"
                ? "bg-moss text-white"
                : "bg-field text-ink/68 hover:bg-moss/8 hover:text-mossDark"
            }`}
          >
            <FileText aria-hidden="true" size={17} />
            Novi oglas od nule
          </button>
          <button
            type="button"
            onClick={() => switchCreationMode("facebook")}
            className={`focus-ring flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition ${
              creationMode === "facebook"
                ? "bg-moss text-white"
                : "bg-field text-ink/68 hover:bg-moss/8 hover:text-mossDark"
            }`}
          >
            <LinkIcon aria-hidden="true" size={17} />
            Uvezi moj Facebook oglas
          </button>
        </div>
      </div>

      {creationMode === "facebook" && !isImportReview ? (
        <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-skywash text-mossDark">
              <LinkIcon aria-hidden="true" size={21} />
            </span>
            <div>
              <h2 className="text-2xl font-black text-ink">Uvezi moj Facebook oglas</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/68">
                Ako već imaš oglas u Facebook grupi, zalijepi tekst oglasa ovdje. Buvljak će ga pretvoriti u uredan oglas koji možeš pregledati i potvrditi.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-lg border border-honey/30 bg-honey/16 p-4 text-sm font-bold text-ink/72">
            <p>Najbolje radi ako zalijepiš tekst svoje Facebook objave.</p>
            <p>Link iz privatne grupe možda neće biti čitljiv.</p>
            <p>Ne uvozi tuđe oglase bez dopuštenja.</p>
          </div>

          {importError ? (
            <div className="mt-5 flex gap-3 rounded-lg border border-clay/20 bg-clay/8 p-4 text-clay">
              <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
              <p className="text-sm font-black leading-relaxed">{importError}</p>
            </div>
          ) : null}

          {importFacebookUrl.trim() ? (
            <div className="mt-5 flex gap-3 rounded-lg border border-moss/16 bg-moss/8 p-4 text-mossDark">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
              <p className="text-sm font-bold leading-relaxed">
                Facebook link ćemo spremiti kao izvor, ali zbog privatnosti grupa možda ne možemo automatski pročitati sadržaj. Zalijepi tekst oglasa ispod za najbolji rezultat.
              </p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-black text-ink">Facebook link, opcionalno</span>
              <input
                type="url"
                value={importFacebookUrl}
                onChange={(event) => setImportFacebookUrl(event.target.value)}
                placeholder="https://www.facebook.com/..."
                className="focus-ring h-12 rounded-lg border border-ink/12 bg-field px-4 text-base font-semibold text-ink placeholder:text-ink/38"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-ink">Tekst oglasa</span>
              <textarea
                rows={8}
                value={importRawText}
                onChange={(event) => setImportRawText(event.target.value)}
                placeholder="Primjer: Prodajem dječji bicikl 20 cola, Nova Gradiška, 50 eura, inbox..."
                className="focus-ring resize-y rounded-lg border border-ink/12 bg-field px-4 py-3 text-base font-semibold leading-relaxed text-ink placeholder:text-ink/38"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={isParsingImport}
              className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-moss px-5 text-base font-black text-white transition hover:bg-mossDark disabled:cursor-not-allowed disabled:bg-ink/30"
            >
              {isParsingImport ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : <FileText aria-hidden="true" size={18} />}
              {isParsingImport ? "Pretvaram oglas" : "Pretvori u oglas"}
            </button>
            <button
              type="button"
              onClick={() => switchCreationMode("manual")}
              className="focus-ring inline-flex h-12 items-center justify-center rounded-lg border border-ink/12 bg-white px-5 text-base font-black text-ink transition hover:bg-field"
            >
              Radije unosim ručno
            </button>
          </div>
        </section>
      ) : null}

      {creationMode === "manual" || isImportReview ? (
        <form
          className="space-y-6 rounded-lg border border-ink/10 bg-white p-4 shadow-sm sm:p-6"
          onSubmit={handleSubmit}
        >
      {isImportReview ? (
        <section className="rounded-lg border border-moss/16 bg-moss/8 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-ink">Pregledaj prijedlog prije objave</h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/68">
                Prije objave možeš sve urediti. Kontakt podaci se neće javno prikazivati. Otvarat će se tek kroz kasniji kontakt flow.
              </p>
              {importParserLabel ? (
                <p className="mt-2 text-sm font-black text-mossDark">{importParserLabel}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={returnToImportText}
              className="focus-ring inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-field"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Vrati se na tekst
            </button>
          </div>

          {importWarnings.length ? (
            <div className="mt-4 grid gap-2">
              {importWarnings.map((warning) => (
                <div key={warning} className="flex gap-2 rounded-lg border border-honey/28 bg-honey/18 p-3 text-sm font-bold text-ink/72">
                  <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0 text-[#72520d]" size={16} />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          ) : null}

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-black text-ink">Facebook izvor</span>
            <input
              type="url"
              value={form.sourceFacebookUrl}
              onChange={(event) => updateForm("sourceFacebookUrl", event.target.value)}
              placeholder="https://www.facebook.com/..."
              className="focus-ring h-11 rounded-lg border border-ink/12 bg-white px-3 text-sm font-semibold text-ink placeholder:text-ink/38"
            />
          </label>
        </section>
      ) : null}

      {error ? (
        <div className="flex gap-3 rounded-lg border border-clay/20 bg-clay/8 p-4 text-clay">
          <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
          <p className="text-sm font-black leading-relaxed">{error}</p>
        </div>
      ) : null}

      <fieldset>
        <legend className="text-sm font-black text-ink">Tip oglasa</legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {listingTypeOptions.map((option) => (
            <label
              key={option.value}
              className="focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-moss"
            >
              <input
                type="radio"
                name="type"
                value={option.value}
                checked={form.type === option.value}
                onChange={() => handleTypeChange(option.value)}
                className="peer sr-only"
              />
              <span className="grid h-12 cursor-pointer place-items-center rounded-lg border border-ink/12 bg-field px-3 text-sm font-black text-ink/68 transition peer-checked:border-moss peer-checked:bg-moss peer-checked:text-white">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 sm:col-span-2">
          <span className="text-sm font-black text-ink">Naslov</span>
          <input
            type="text"
            value={form.title}
            onChange={(event) => updateForm("title", event.target.value)}
            placeholder="Npr. Prodajem peć na drva"
            className="focus-ring h-12 rounded-lg border border-ink/12 bg-field px-4 text-base font-semibold text-ink placeholder:text-ink/38"
          />
        </label>

        <label className="grid gap-2 sm:col-span-2">
          <span className="text-sm font-black text-ink">Opis</span>
          <textarea
            rows={5}
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
            placeholder="Ukratko napiši stanje, preuzimanje i važne detalje."
            className="focus-ring resize-y rounded-lg border border-ink/12 bg-field px-4 py-3 text-base font-semibold leading-relaxed text-ink placeholder:text-ink/38"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">Grad</span>
          <input
            type="text"
            value={form.city}
            onChange={(event) => updateForm("city", event.target.value)}
            className="focus-ring h-12 rounded-lg border border-ink/12 bg-field px-4 text-base font-semibold text-ink"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">Kategorija</span>
          <select
            value={form.category}
            onChange={(event) => updateForm("category", event.target.value)}
            className="focus-ring h-12 rounded-lg border border-ink/12 bg-field px-4 text-base font-semibold text-ink"
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-black text-ink">Cijena</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {priceOptions.map((priceType) => (
            <label
              key={priceType}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-ink/10 bg-field px-4 py-3"
            >
              <input
                type="radio"
                name="priceType"
                value={priceType}
                checked={form.priceType === priceType}
                onChange={() => updateForm("priceType", priceType)}
                className="h-4 w-4 accent-moss"
              />
              <span className="font-bold text-ink/76">{priceTypeLabels[priceType]}</span>
            </label>
          ))}
        </div>
        {form.type === "sell" ? (
          <p className="text-sm font-semibold leading-relaxed text-ink/62">
            Za Buvljak je normalno cjenkanje - zato možeš označiti &quot;Može dogovor&quot;.
          </p>
        ) : null}
        {form.priceType === "fixed" || form.priceType === "negotiable" || form.type === "want" ? (
          <label className="grid gap-2 sm:max-w-sm">
            <span className="text-sm font-black text-ink">
              {form.type === "want" ? "Maksimalni budžet" : "Cijena"}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={form.price}
              onChange={(event) => updateForm("price", event.target.value)}
              placeholder="Npr. 40 €"
              className="focus-ring h-12 rounded-lg border border-ink/12 bg-field px-4 text-base font-semibold text-ink placeholder:text-ink/38"
            />
          </label>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-black text-ink">Slike</legend>
        <p className="mt-1 text-sm font-semibold text-ink/62">
          Dodaj 1 do 5 slika. Velike slike se smanjuju prije uploada radi bržeg spremanja.
        </p>
        <label className="focus-ring mt-3 flex min-h-28 cursor-pointer items-center justify-center rounded-lg border border-dashed border-moss/38 bg-moss/8 px-4 text-center text-sm font-black text-mossDark transition hover:bg-moss/12">
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={handleImagesChange}
            disabled={images.length >= 5 || isSubmitting}
          />
          <span className="inline-flex items-center gap-2">
            <ImagePlus aria-hidden="true" size={18} />
            Dodaj slike
          </span>
        </label>
        {images.length ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {images.map((image) => (
              <div key={image.id} className="flex gap-3 rounded-lg border border-ink/10 bg-field p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.previewUrl}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-ink">{image.file.name}</p>
                  <p className="mt-1 text-xs font-bold text-ink/58">
                    {formatBytes(image.originalSize)}
                    {image.compressedSize ? ` -> ${formatBytes(image.compressedSize)}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="focus-ring grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-ink/12 bg-white text-ink"
                  aria-label="Ukloni sliku"
                >
                  <X aria-hidden="true" size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-black text-ink">Način kontakta</legend>
        <p className="mt-1 text-sm font-semibold text-ink/62">
          Kontakt će se kasnije otvoriti tek nakon klika.
        </p>
        <div className="mt-3 grid gap-2">
          {contactOptions.map((method) => (
            <label
              key={method.value}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-ink/10 bg-field px-4 py-3"
            >
              <input
                type="radio"
                name="contactMethod"
                value={method.value}
                checked={form.contactMethod === method.value}
                onChange={() => updateForm("contactMethod", method.value)}
                className="h-4 w-4 accent-moss"
              />
              <span className="font-bold text-ink/76">{method.label}</span>
            </label>
          ))}
        </div>

        {form.contactMethod === "whatsapp" ? (
          <label className="mt-3 grid gap-2">
            <span className="text-sm font-black text-ink">WhatsApp broj</span>
            <input
              type="tel"
              value={form.contactPhone}
              onChange={(event) => updateForm("contactPhone", event.target.value)}
              placeholder="+385..."
              className="focus-ring h-12 rounded-lg border border-ink/12 bg-field px-4 text-base font-semibold text-ink placeholder:text-ink/38"
            />
            <span className="text-xs font-bold text-ink/58">Broj se neće javno prikazivati.</span>
          </label>
        ) : null}

        {form.contactMethod === "email" ? (
          <label className="mt-3 grid gap-2">
            <span className="text-sm font-black text-ink">Email</span>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(event) => updateForm("contactEmail", event.target.value)}
              placeholder={defaultEmail || "tvoj@email.hr"}
              className="focus-ring h-12 rounded-lg border border-ink/12 bg-field px-4 text-base font-semibold text-ink"
            />
          </label>
        ) : null}

        {form.contactMethod === "facebook" ? (
          <label className="mt-3 grid gap-2">
            <span className="text-sm font-black text-ink">Facebook link</span>
            <input
              type="url"
              value={form.contactFacebookUrl}
              onChange={(event) => updateForm("contactFacebookUrl", event.target.value)}
              placeholder="https://facebook.com/..."
              className="focus-ring h-12 rounded-lg border border-ink/12 bg-field px-4 text-base font-semibold text-ink placeholder:text-ink/38"
            />
          </label>
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={isSubmitting}
          className="focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-moss px-5 text-base font-black text-white transition hover:bg-mossDark disabled:cursor-not-allowed disabled:bg-ink/30 sm:w-auto"
        >
          {isSubmitting ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : <Send aria-hidden="true" size={18} />}
          {isSubmitting ? "Spremam oglas" : isImportReview ? "Potvrdi i objavi" : "Objavi oglas"}
        </button>
        {isImportReview ? (
          <button
            type="button"
            onClick={returnToImportText}
            className="focus-ring inline-flex h-12 items-center justify-center rounded-lg border border-ink/12 bg-white px-5 text-base font-black text-ink transition hover:bg-field"
          >
            Vrati se na tekst
          </button>
        ) : null}
      </div>

      <div className="flex gap-2 rounded-lg bg-moss/8 p-3 text-sm font-bold text-mossDark">
        <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
        <span>Status oglasa nakon objave bit će aktivan.</span>
      </div>
        </form>
      ) : null}
    </div>
  );
}

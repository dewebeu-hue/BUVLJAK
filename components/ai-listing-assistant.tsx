"use client";

import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  PencilLine,
  Sparkles,
  X
} from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

const MAX_AI_IMAGES = 3;

type AssistantImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type AssistantState = "idle" | "loading" | "preview";

type AiListingAssistantProps = {
  onManualContinue: () => void;
  isDisabled?: boolean;
};

const resultSlots = [
  "Predloženi naslov",
  "Predloženi opis",
  "Kategorija",
  "Stanje",
  "Okvirna cijena",
  "Preporuka cijene",
  "Tekst za Facebook",
  "Pouzdanost prijedloga"
];

export function AiListingAssistant({
  onManualContinue,
  isDisabled = false
}: AiListingAssistantProps) {
  const [images, setImages] = useState<AssistantImage[]>([]);
  const [assistantState, setAssistantState] = useState<AssistantState>("idle");
  const [message, setMessage] = useState("");
  const imagesRef = useRef<AssistantImage[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  function handleImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const availableSlots = MAX_AI_IMAGES - images.length;
    const validImages = selectedFiles.filter((file) => file.type.startsWith("image/"));

    setMessage("");
    setAssistantState("idle");

    if (selectedFiles.length === 0) {
      return;
    }

    if (availableSlots <= 0) {
      setMessage("Možeš dodati najviše 3 slike za AI prijedlog.");
      event.target.value = "";
      return;
    }

    if (validImages.length === 0) {
      setMessage("Dodaj fotografiju predmeta u podržanom slikovnom formatu.");
      event.target.value = "";
      return;
    }

    const nextImages = validImages.slice(0, availableSlots).map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setImages((current) => [...current, ...nextImages]);

    if (validImages.length > availableSlots || selectedFiles.length > availableSlots) {
      setMessage("Dodane su prve 3 slike. Za AI prijedlog je dovoljno 1 do 3 fotografije.");
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
    setAssistantState("idle");
    setMessage("");
  }

  function handleSuggestClick() {
    if (images.length < 1) {
      setMessage("Dodaj barem jednu sliku predmeta prije AI prijedloga.");
      return;
    }

    setAssistantState("loading");
    setMessage("Slike ostaju samo u pregledniku. AI analiza se povezuje u sljedećem koraku.");

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setAssistantState("preview");
      setMessage("UI je spreman za budući AI prijedlog. Možeš nastaviti ručno.");
    }, 700);
  }

  return (
    <section className="rounded-lg border border-moss/16 bg-moss/8 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-mossDark shadow-sm">
          <Sparkles aria-hidden="true" size={21} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-mossDark/72">
            AI pomoćnik
          </p>
          <h2 className="mt-1 text-2xl font-black leading-tight text-ink">
            Slikaj predmet i predloži oglas
          </h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/68">
            Dodaj 1-3 fotografije predmeta, a Buvljak će ti predložiti naslov, opis i okvirnu cijenu.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-lg border border-honey/24 bg-white/74 p-4 text-sm font-bold leading-relaxed text-ink/72">
        <p className="flex gap-2">
          <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0 text-[#72520d]" size={17} />
          <span>AI može pogriješiti. Prije objave provjeri opis, stanje i cijenu.</span>
        </p>
        <p className="flex gap-2">
          <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0 text-[#72520d]" size={17} />
          <span>
            Ne šalji osobne dokumente, lica, registarske oznake, telefonske brojeve, emailove ili
            privatne podatke kroz AI analizu.
          </span>
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        <label className="focus-ring flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-moss/38 bg-white px-4 text-center text-sm font-black text-mossDark transition hover:bg-field">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="sr-only"
            onChange={handleImagesChange}
            disabled={isDisabled || assistantState === "loading" || images.length >= MAX_AI_IMAGES}
          />
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-moss/10">
            <Camera aria-hidden="true" size={20} />
          </span>
          <span>Slikaj ili dodaj slike predmeta</span>
          <span className="text-xs font-bold text-ink/52">1 do 3 slike, samo lokalni pregled u ovom koraku</span>
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
                  >
                    <X aria-hidden="true" size={16} />
                  </button>
                </div>
                <p className="mt-2 truncate text-xs font-black text-ink/62">{image.file.name}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {message ? (
        <div className="mt-4 flex gap-2 rounded-lg border border-ink/8 bg-white p-3 text-sm font-black text-ink/66" aria-live="polite">
          {assistantState === "loading" ? (
            <Loader2 aria-hidden="true" className="mt-0.5 shrink-0 animate-spin text-moss" size={17} />
          ) : assistantState === "preview" ? (
            <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-mossDark" size={17} />
          ) : (
            <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0 text-clay" size={17} />
          )}
          <span>{message}</span>
        </div>
      ) : null}

      {assistantState === "loading" ? (
        <div className="mt-4 rounded-lg border border-ink/10 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-black text-mossDark">
            <Loader2 aria-hidden="true" className="animate-spin" size={17} />
            Analiziram predmet...
          </div>
          <div className="mt-4 grid gap-2">
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-field" />
            <div className="h-4 w-full animate-pulse rounded-full bg-field" />
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-field" />
          </div>
        </div>
      ) : null}

      {assistantState === "preview" ? (
        <div className="mt-4 rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-ink">Pregled AI prijedloga</h3>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/62">
                Ovdje će se prikazati prijedlog nakon povezivanja sigurnog server-side AI actiona.
              </p>
            </div>
            <span className="inline-flex h-8 items-center rounded-full bg-field px-3 text-xs font-black text-ink/54">
              Priprema
            </span>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {resultSlots.map((slot) => (
              <div
                key={slot}
                className={slot === "Predloženi opis" || slot === "Tekst za Facebook" ? "sm:col-span-2" : undefined}
              >
                <dt className="text-xs font-black uppercase tracking-[0.1em] text-ink/45">{slot}</dt>
                <dd className="mt-2 rounded-lg bg-field p-3">
                  <span className="block h-3 w-3/4 rounded-full bg-ink/10" />
                  <span className="sr-only">Mjesto za budući AI prijedlog</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-ink/20 px-4 text-sm font-black text-white disabled:cursor-not-allowed"
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
          disabled={isDisabled || assistantState === "loading"}
          className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-moss px-5 text-base font-black text-white transition hover:bg-mossDark disabled:cursor-not-allowed disabled:bg-ink/30"
        >
          {assistantState === "loading" ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={18} />
          ) : (
            <ImagePlus aria-hidden="true" size={18} />
          )}
          {assistantState === "loading" ? "Analiziram predmet" : "Predloži oglas"}
        </button>
        <button
          type="button"
          onClick={onManualContinue}
          disabled={isDisabled}
          className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-5 text-base font-black text-ink transition hover:bg-field disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PencilLine aria-hidden="true" size={18} />
          Preskoči AI i nastavi ručno
        </button>
      </div>
    </section>
  );
}

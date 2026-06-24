"use client";

import { useMutation, useQuery } from "convex/react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

import {
  getMyAdvertiserProfileRef,
  getMyAdvertiserProfileStatusRef,
  upsertMyAdvertiserProfileRef,
} from "@/lib/advertiser-profile-refs";

type AdvertiserProfileFormMode = "account" | "gate";

type AdvertiserProfileFormProps = {
  mode?: AdvertiserProfileFormMode;
  onSaved?: () => void;
  onCancel?: () => void;
};

type AdvertiserProfileFormState = {
  accountType: "individual" | "business";
  firstName: string;
  lastName: string;
  oib: string;
  country: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  county: string;
  phone: string;
  publicCityEnabled: boolean;
  publicPhoneEnabled: boolean;
};

const initialAdvertiserProfileForm: AdvertiserProfileFormState = {
  accountType: "individual",
  firstName: "",
  lastName: "",
  oib: "",
  country: "Hrvatska",
  street: "",
  houseNumber: "",
  postalCode: "",
  city: "Nova Gradiška",
  county: "Brodsko-posavska",
  phone: "",
  publicCityEnabled: true,
  publicPhoneEnabled: false,
};

function normalizeOib(value: string) {
  return value.replace(/\D/g, "");
}

function isValidOib(value: string) {
  const oib = normalizeOib(value);

  if (!/^\d{11}$/.test(oib)) {
    return false;
  }

  let remainder = 10;

  for (let index = 0; index < 10; index += 1) {
    remainder += Number(oib[index]);
    remainder %= 10;

    if (remainder === 0) {
      remainder = 10;
    }

    remainder *= 2;
    remainder %= 11;
  }

  const controlDigit = 11 - remainder;
  const expectedDigit = controlDigit === 10 ? 0 : controlDigit;

  return expectedDigit === Number(oib[10]);
}

function validateAdvertiserProfile(form: AdvertiserProfileFormState) {
  const requiredFields: Array<[keyof AdvertiserProfileFormState, string]> = [
    ["firstName", "ime"],
    ["lastName", "prezime"],
    ["country", "država"],
    ["street", "ulica"],
    ["houseNumber", "kućni broj"],
    ["postalCode", "poštanski broj"],
    ["city", "mjesto"],
    ["county", "županija"],
    ["phone", "telefon"],
  ];

  const missingFields = requiredFields
    .filter(([key]) => typeof form[key] === "string" && !String(form[key]).trim())
    .map(([, label]) => label);

  if (missingFields.length > 0) {
    return `Dopuni obavezna polja: ${missingFields.join(", ")}.`;
  }

  if (!isValidOib(form.oib)) {
    return "Provjeri OIB. Mora imati 11 znamenki i ispravnu kontrolnu znamenku.";
  }

  return null;
}

export function AdvertiserProfileForm({
  mode = "account",
  onSaved,
  onCancel,
}: AdvertiserProfileFormProps) {
  const profile = useQuery(getMyAdvertiserProfileRef);
  const status = useQuery(getMyAdvertiserProfileStatusRef);

  if (profile === undefined || status === undefined) {
    return (
      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-ink/8" />
          <div className="min-w-0 flex-1">
            <div className="h-5 w-48 rounded-full bg-ink/8" />
            <div className="mt-3 h-4 w-full max-w-md rounded-full bg-ink/8" />
          </div>
        </div>
      </section>
    );
  }

  const initialForm = profile
    ? {
        accountType: profile.accountType,
        firstName: profile.firstName,
        lastName: profile.lastName,
        oib: profile.oib,
        country: profile.country,
        street: profile.street,
        houseNumber: profile.houseNumber,
        postalCode: profile.postalCode,
        city: profile.city,
        county: profile.county,
        phone: profile.phone,
        publicCityEnabled: profile.publicCityEnabled,
        publicPhoneEnabled: profile.publicPhoneEnabled,
      }
    : initialAdvertiserProfileForm;

  return (
    <AdvertiserProfileFormContent
      key={`${mode}-${profile?._id ?? "new"}-${profile?.updatedAt ?? 0}`}
      mode={mode}
      initialForm={initialForm}
      isComplete={status.isComplete}
      missingFields={status.missingFields}
      onSaved={onSaved}
      onCancel={onCancel}
    />
  );
}

function AdvertiserProfileFormContent({
  mode,
  initialForm,
  isComplete,
  missingFields,
  onSaved,
  onCancel,
}: AdvertiserProfileFormProps & {
  initialForm: AdvertiserProfileFormState;
  isComplete: boolean;
  missingFields: string[];
}) {
  const upsertAdvertiserProfile = useMutation(upsertMyAdvertiserProfileRef);
  const [form, setForm] = useState<AdvertiserProfileFormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isGate = mode === "gate";

  function updateForm<Key extends keyof AdvertiserProfileFormState>(
    key: Key,
    value: AdvertiserProfileFormState[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const validationError = validateAdvertiserProfile(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      await upsertAdvertiserProfile({
        ...form,
        oib: normalizeOib(form.oib),
      });
      setNotice("Podaci su spremljeni. Ne prikazuju se javno na oglasu.");
      onSaved?.();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Podaci nisu spremljeni.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      className={
        isGate
          ? "rounded-lg border border-clay/20 bg-clay/8 p-5 shadow-sm sm:p-6"
          : "rounded-lg border border-ink/10 bg-white p-5 shadow-sm sm:p-6"
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div
            className={
              isGate
                ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-clay/12 text-clay"
                : "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-moss/10 text-mossDark"
            }
          >
            <ShieldCheck aria-hidden="true" size={22} />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-black leading-tight text-ink">
              {isGate ? "Dopuni podatke za predaju oglasa" : "Podaci za predaju oglasa"}
            </h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/66">
              Ovi podaci služe za sigurnost, moderaciju i zakonsku usklađenost prije prve javne
              objave. Ne prikazuju se javno na oglasu i ne šalju se AI pomoćniku.
            </p>
          </div>
        </div>
        <span
          className={
            isComplete
              ? "inline-flex shrink-0 items-center gap-2 rounded-full bg-moss/10 px-3 py-1 text-xs font-black text-mossDark"
              : "inline-flex shrink-0 items-center gap-2 rounded-full bg-clay/10 px-3 py-1 text-xs font-black text-clay"
          }
        >
          {isComplete ? <CheckCircle2 aria-hidden="true" size={15} /> : <AlertCircle aria-hidden="true" size={15} />}
          {isComplete ? "Dopunjeno" : "Nedostaje"}
        </span>
      </div>

      {!isComplete && missingFields.length > 0 ? (
        <div className="mt-4 rounded-lg border border-clay/20 bg-white/70 px-4 py-3 text-sm font-bold leading-relaxed text-clay">
          Nedostaje ili treba provjeriti: {missingFields.join(", ")}.
        </div>
      ) : null}

      <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileField
            label="Ime"
            value={form.firstName}
            autoComplete="given-name"
            onChange={(value) => updateForm("firstName", value)}
          />
          <ProfileField
            label="Prezime"
            value={form.lastName}
            autoComplete="family-name"
            onChange={(value) => updateForm("lastName", value)}
          />
          <ProfileField
            label="OIB"
            value={form.oib}
            inputMode="numeric"
            maxLength={11}
            onChange={(value) => updateForm("oib", normalizeOib(value).slice(0, 11))}
          />
          <ProfileField
            label="Telefon"
            value={form.phone}
            type="tel"
            autoComplete="tel"
            onChange={(value) => updateForm("phone", value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileField
            label="Država"
            value={form.country}
            autoComplete="country-name"
            onChange={(value) => updateForm("country", value)}
          />
          <ProfileField
            label="Županija"
            value={form.county}
            onChange={(value) => updateForm("county", value)}
          />
          <ProfileField
            label="Mjesto"
            value={form.city}
            autoComplete="address-level2"
            onChange={(value) => updateForm("city", value)}
          />
          <ProfileField
            label="Poštanski broj"
            value={form.postalCode}
            inputMode="numeric"
            autoComplete="postal-code"
            onChange={(value) => updateForm("postalCode", value)}
          />
          <ProfileField
            label="Ulica"
            value={form.street}
            autoComplete="address-line1"
            onChange={(value) => updateForm("street", value)}
          />
          <ProfileField
            label="Kućni broj"
            value={form.houseNumber}
            autoComplete="address-line2"
            onChange={(value) => updateForm("houseNumber", value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileCheckbox
            checked={form.publicCityEnabled}
            label="Dopusti prikaz mjesta na oglasu"
            onChange={(checked) => updateForm("publicCityEnabled", checked)}
          />
          <ProfileCheckbox
            checked={form.publicPhoneEnabled}
            label="Telefon koristi samo kroz sigurni kontakt flow"
            onChange={(checked) => updateForm("publicPhoneEnabled", checked)}
          />
        </div>

        {error ? (
          <div className="flex gap-3 rounded-lg border border-clay/20 bg-clay/8 p-4 text-clay">
            <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
            <p className="text-sm font-black leading-relaxed">{error}</p>
          </div>
        ) : null}

        {notice ? (
          <div className="flex gap-3 rounded-lg border border-moss/20 bg-moss/8 p-4 text-mossDark">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
            <p className="text-sm font-black leading-relaxed">{notice}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-lg border border-ink/12 bg-white px-4 py-2 text-sm font-black text-ink transition hover:bg-field"
            >
              Kasnije
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isSaving}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 py-2 text-sm font-black text-white transition hover:bg-mossDark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 aria-hidden="true" size={18} className="animate-spin" /> : null}
            {isGate
              ? "Spremi i nastavi objavu"
              : isComplete
                ? "Uredi podatke za predaju oglasa"
                : "Spremi podatke za predaju oglasa"}
          </button>
        </div>
      </form>
    </section>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "text" | "numeric" | "tel" | "email" | "url" | "search" | "none" | "decimal";
  autoComplete?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-ink">{label}</span>
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring mt-2 h-12 w-full rounded-lg border border-ink/12 bg-white px-4 text-sm font-bold text-ink outline-none transition placeholder:text-ink/38"
      />
    </label>
  );
}

function ProfileCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-ink/10 bg-field px-4 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-5 w-5 accent-moss"
      />
      <span className="text-sm font-bold leading-relaxed text-ink/76">{label}</span>
    </label>
  );
}

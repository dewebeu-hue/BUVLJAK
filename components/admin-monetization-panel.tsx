"use client";

import { useMutation, useQuery } from "convex/react";
import { CreditCard, Megaphone, PackageCheck, Sparkles, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

type MonetizationKey =
  | "localSponsorsEnabled"
  | "featuredListingsEnabled"
  | "proPlansEnabled"
  | "paymentsEnabled";

type MonetizationSettings = Record<MonetizationKey, boolean> & {
  updatedAt?: number;
};

const flagItems: Array<{
  key: MonetizationKey;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    key: "localSponsorsEnabled",
    label: "Lokalni sponzori",
    description: "Prikaz sponzorskog bloka u feedu kad postoje aktivni lokalni sponzori.",
    icon: Megaphone
  },
  {
    key: "featuredListingsEnabled",
    label: "Istaknuti oglasi",
    description: "Dozvoljava prikaz badgea i vlasnički beta CTA za isticanje oglasa.",
    icon: Sparkles
  },
  {
    key: "proPlansEnabled",
    label: "Pro paketi",
    description: "Otvara stranicu s paketima, bez plaćanja i bez checkouta.",
    icon: PackageCheck
  },
  {
    key: "paymentsEnabled",
    label: "Plaćanja",
    description: "Tehnička priprema za buduća plaćanja; sama ne prikazuje monetizaciju.",
    icon: CreditCard
  }
];

const defaultSettings: MonetizationSettings = {
  localSponsorsEnabled: false,
  featuredListingsEnabled: false,
  proPlansEnabled: false,
  paymentsEnabled: false
};

export function AdminMonetizationPanel() {
  if (!hasConvexUrl) {
    return (
      <MonetizationPanelShell
        settings={defaultSettings}
        isDisabled
        statusMessage="Convex nije spojen, pa su sve monetization zastavice lokalno prikazane kao ugašene."
      />
    );
  }

  return <ConnectedAdminMonetizationPanel />;
}

function ConnectedAdminMonetizationPanel() {
  const settings = useQuery(api.monetization.getMonetizationSettings) as
    | MonetizationSettings
    | undefined;
  const updateSettings = useMutation(api.monetization.updateMonetizationSettings);
  const [pendingKey, setPendingKey] = useState<MonetizationKey | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  async function toggleFlag(key: MonetizationKey) {
    if (!settings || pendingKey) {
      return;
    }

    setPendingKey(key);
    setStatusMessage("");

    try {
      await updateSettings({
        [key]: !settings[key]
      });
      setStatusMessage("Postavke monetizacije su spremljene.");
    } catch {
      setStatusMessage("Samo admin može mijenjati monetizaciju.");
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <MonetizationPanelShell
      settings={settings ?? defaultSettings}
      isLoading={settings === undefined}
      pendingKey={pendingKey}
      statusMessage={statusMessage}
      onToggle={toggleFlag}
    />
  );
}

function MonetizationPanelShell({
  settings,
  isDisabled = false,
  isLoading = false,
  pendingKey = null,
  statusMessage,
  onToggle
}: {
  settings: MonetizationSettings;
  isDisabled?: boolean;
  isLoading?: boolean;
  pendingKey?: MonetizationKey | null;
  statusMessage?: string;
  onToggle?: (key: MonetizationKey) => void;
}) {
  return (
    <section className="mt-7 rounded-lg border border-ink/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-ink">Monetizacija</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-ink/64">
            Skriveni prekidači za lokalne sponzore, isticanje oglasa, pro pakete i buduća plaćanja.
          </p>
        </div>
        <span className="inline-flex h-9 items-center rounded-full bg-field px-3 text-xs font-black text-ink/64">
          Default: sve ugašeno
        </span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {flagItems.map((item) => (
          <FeatureToggle
            key={item.key}
            item={item}
            isEnabled={settings[item.key]}
            isBusy={pendingKey === item.key}
            isDisabled={isDisabled || isLoading || Boolean(pendingKey)}
            onToggle={() => onToggle?.(item.key)}
          />
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-ink/8 bg-field p-4">
        <p className="text-sm font-black text-ink">Preview</p>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/64">
          {previewCopy(settings)}
        </p>
        {statusMessage ? (
          <p className="mt-3 text-sm font-black text-mossDark" aria-live="polite">
            {statusMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function FeatureToggle({
  item,
  isEnabled,
  isBusy,
  isDisabled,
  onToggle
}: {
  item: (typeof flagItems)[number];
  isEnabled: boolean;
  isBusy: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}) {
  const Icon = item.icon;

  return (
    <div className="rounded-lg border border-ink/10 bg-field/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-mossDark">
            <Icon aria-hidden size={19} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-ink">{item.label}</h3>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-black ${
                  isEnabled ? "bg-moss/10 text-mossDark" : "bg-ink/8 text-ink/52"
                }`}
              >
                {isEnabled ? "Uključeno" : "Skriveno"}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/62">
              {item.description}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={onToggle}
          disabled={isDisabled}
          className={`focus-ring relative h-8 w-14 shrink-0 rounded-full border transition disabled:cursor-not-allowed disabled:opacity-55 ${
            isEnabled ? "border-moss bg-moss" : "border-ink/14 bg-white"
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${
              isEnabled ? "left-7" : "left-1"
            }`}
          />
          <span className="sr-only">
            {isEnabled ? "Isključi" : "Uključi"} {item.label}
          </span>
        </button>
      </div>
      {isBusy ? <p className="mt-3 text-xs font-black text-ink/54">Spremanje...</p> : null}
    </div>
  );
}

function previewCopy(settings: MonetizationSettings) {
  const enabled = flagItems.filter((item) => settings[item.key]);

  if (enabled.length === 0) {
    return "Korisnici trenutno ne vide sponzore, isticanja, pro pakete ni plaćanja.";
  }

  if (settings.paymentsEnabled && enabled.length === 1) {
    return "Plaćanja su pripremljena, ali sama ne otvaraju korisnički monetization UI.";
  }

  const visible = [
    settings.localSponsorsEnabled ? "lokalni sponzori u feedu" : null,
    settings.featuredListingsEnabled ? "istaknuti oglasi i beta CTA za vlasnike" : null,
    settings.proPlansEnabled ? "stranica s pro paketima" : null
  ].filter(Boolean);

  return visible.length > 0
    ? `Korisnici mogu vidjeti: ${visible.join(", ")}. Checkout nije uključen.`
    : "Monetizacija za korisnike je i dalje skrivena.";
}

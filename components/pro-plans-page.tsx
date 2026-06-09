"use client";

import { useQuery } from "convex/react";
import { Check, PackageCheck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { proPlans } from "@/lib/pro-plans";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

type MonetizationSettings = {
  proPlansEnabled: boolean;
  paymentsEnabled: boolean;
};

export function ProPlansPage() {
  if (!hasConvexUrl) {
    return <PlansUnavailable />;
  }

  return <ConnectedProPlansPage />;
}

function ConnectedProPlansPage() {
  const settings = useQuery(api.monetization.getMonetizationSettings) as
    | MonetizationSettings
    | undefined;

  if (settings === undefined) {
    return (
      <main className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="h-40 animate-pulse rounded-lg border border-ink/10 bg-white" />
        </div>
      </main>
    );
  }

  if (!settings.proPlansEnabled) {
    return <PlansUnavailable />;
  }

  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-moss/10 px-3 py-1 text-sm font-black text-mossDark">
              Buvljak Pro
            </span>
            <h1 className="mt-3 text-4xl font-black leading-tight text-ink">Paketi za aktivnije oglašavanje</h1>
          </div>
          <span className="inline-flex h-10 items-center rounded-full bg-field px-3 text-sm font-black text-ink/64">
            Beta prikaz
          </span>
        </div>

        <section className="mt-7 grid gap-4 lg:grid-cols-3">
          {proPlans.map((plan) => (
            <article key={plan.id} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-ink">{plan.name}</h2>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/64">
                    {plan.summary}
                  </p>
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-moss/10 text-mossDark">
                  <PackageCheck aria-hidden="true" size={21} />
                </span>
              </div>
              <p className="mt-5 text-xl font-black text-ink">{plan.priceLabel}</p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm font-semibold leading-relaxed text-ink/68">
                    <Check aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-moss" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled
                className="mt-5 inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-lg border border-ink/12 bg-field px-4 text-sm font-black text-ink/54"
              >
                {settings.paymentsEnabled
                  ? "Checkout još nije aktivan"
                  : "Javi se adminu za beta paket"}
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function PlansUnavailable() {
  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black leading-tight text-ink">Paketi trenutno nisu dostupni.</h1>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-ink/64">
          Buvljak trenutno ostaje fokusiran na jednostavnu objavu i pregled lokalnih oglasa.
        </p>
      </div>
    </main>
  );
}

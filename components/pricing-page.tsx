"use client";

import { useQuery } from "convex/react";
import { AlertCircle, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { pricingPlans } from "@/lib/pricing";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

type MonetizationSettings = {
  showPricingOnLanding: boolean;
};

export function PricingPage() {
  if (!hasConvexUrl) {
    return <PricingUnavailable />;
  }

  return <ConnectedPricingPage />;
}

function ConnectedPricingPage() {
  const settings = useQuery(api.monetization.getMonetizationSettings) as
    | MonetizationSettings
    | undefined;

  if (settings === undefined) {
    return (
      <main className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="h-48 animate-pulse rounded-lg border border-ink/10 bg-white" />
        </div>
      </main>
    );
  }

  if (!settings.showPricingOnLanding) {
    return <PricingUnavailable />;
  }

  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm sm:p-7">
          <span className="inline-flex rounded-full bg-moss/10 px-3 py-1 text-sm font-black text-mossDark">
            Beta · Nova Gradiška i okolica
          </span>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.75fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-black leading-tight text-ink sm:text-5xl">
                Pretplate i isticanje oglasa
              </h1>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-relaxed text-ink/68 sm:text-lg">
                Buvljak.hr je u beta fazi. Obični oglasi ostaju besplatni, a isticanje oglasa
                pomaže da tvoj oglas vidi više ljudi.
              </p>
            </div>
            <div className="rounded-lg border border-honey/24 bg-honey/14 p-4">
              <p className="flex gap-2 text-sm font-black leading-relaxed text-ink/74">
                <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0 text-[#72520d]" size={17} />
                Online plaćanje još nije uključeno u MVP-u. Isticanje oglasa u beta fazi može se
                aktivirati ručno nakon dogovora s Buvljak.hr timom.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          {pricingPlans.map((plan) => (
            <article
              key={plan.id}
              className={`rounded-lg border bg-white p-5 shadow-sm sm:p-6 ${
                plan.isPrimary ? "border-moss/28" : "border-ink/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-mossDark/70">
                    {plan.eyebrow}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-ink">{plan.name}</h2>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/62">
                    {plan.summary}
                  </p>
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-moss/10 text-mossDark">
                  <Sparkles aria-hidden="true" size={21} />
                </span>
              </div>

              <p className="mt-6 text-4xl font-black tracking-normal text-ink">{plan.priceLabel}</p>

              <ul className="mt-5 grid gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm font-semibold leading-relaxed text-ink/70">
                    <Check aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-moss" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.ctaHref ? (
                <Link
                  href={plan.ctaHref}
                  className={`focus-ring mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg px-5 text-base font-black transition ${
                    plan.isPrimary
                      ? "bg-moss text-white hover:bg-mossDark"
                      : "border border-ink/12 bg-white text-ink hover:bg-field"
                  }`}
                >
                  {plan.ctaLabel}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-6 inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-lg border border-ink/12 bg-field px-5 text-base font-black text-ink/54"
                >
                  {plan.ctaLabel}
                </button>
              )}
            </article>
          ))}
        </section>

        <section className="mt-5 rounded-lg border border-ink/10 bg-field p-5">
          <h2 className="text-lg font-black text-ink">Važna napomena</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/68">
            Buvljak.hr ne sudjeluje u plaćanju, dostavi ni izvršenju dogovora između korisnika.
            Pretplate i isticanje odnose se samo na vidljivost oglasa na platformi.
          </p>
        </section>
      </div>
    </main>
  );
}

function PricingUnavailable() {
  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black leading-tight text-ink">
          Pretplate trenutno nisu javno dostupne.
        </h1>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-ink/64">
          Buvljak.hr trenutno ostaje fokusiran na jednostavnu objavu i pregled lokalnih oglasa.
        </p>
        <Link
          href="/"
          className="focus-ring mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
        >
          Natrag na početnu
        </Link>
      </div>
    </main>
  );
}

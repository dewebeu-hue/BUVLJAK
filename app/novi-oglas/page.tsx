"use client";

import { Show, SignInButton } from "@clerk/nextjs";
import { Camera, FileText } from "lucide-react";
import { FacebookAuthButton } from "@/components/facebook-auth-button";
import { NewListingForm } from "@/components/new-listing-form";

export default function NewListingPage() {
  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <section>
          <span className="inline-flex rounded-full bg-honey/24 px-3 py-1 text-sm font-black text-[#72520d]">
            Novi oglas
          </span>
          <h1 className="mt-3 text-4xl font-black leading-tight text-ink">Objavi nešto za susjedstvo</h1>

          <Show when="signed-out">
            <div className="mt-6 rounded-lg border border-honey/30 bg-honey/16 p-5">
              <h2 className="text-xl font-black text-ink">Prijava je potrebna za objavu</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/68">
                Prijavi se da možeš objaviti i kasnije urediti svoj oglas.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="focus-ring inline-flex h-11 items-center justify-center rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
                  >
                    Prijava
                  </button>
                </SignInButton>
                <FacebookAuthButton redirectUrlComplete="/novi-oglas" />
              </div>
            </div>
          </Show>

          <Show when="signed-in">
            <NewListingForm />
          </Show>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-skywash text-mossDark">
                <Camera aria-hidden="true" size={21} />
              </span>
              <h2 className="text-xl font-black text-ink">Slike oglasa</h2>
            </div>
            <div className="mt-5 grid aspect-[4/3] place-items-center rounded-lg border border-dashed border-ink/18 bg-field">
              <span className="px-4 text-center text-sm font-black text-ink/45">
                Slike se komprimiraju prije uploada u Convex storage.
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-moss/16 bg-moss/8 p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-mossDark">
                <FileText aria-hidden="true" size={21} />
              </span>
              <div>
                <h2 className="text-xl font-black text-ink">Jednostavan dogovor</h2>
                <p className="mt-2 leading-relaxed text-ink/66">
                  Buvljak sprema kontakt, ali ga ne prikazuje javno. Dogovor ostaje direktno između korisnika.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

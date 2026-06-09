"use client";

import { Show, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { PlusCircle, UserRound } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { demoListings } from "@/lib/listings";

const userDemoListings = demoListings.slice(0, 3);

export default function MyListingsPage() {
  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <span className="inline-flex rounded-full bg-moss/10 px-3 py-1 text-sm font-black text-mossDark">
          Korisnički profil
        </span>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black leading-tight text-ink">Moji oglasi</h1>
            <p className="mt-3 max-w-2xl text-base font-semibold leading-relaxed text-ink/66">
              Ovdje upravljaš svojim aktivnim, pauziranim i riješenim oglasima.
            </p>
          </div>
          <Show when="signed-in">
            <Link
              href="/novi-oglas"
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
            >
              <PlusCircle aria-hidden="true" size={18} />
              Objavi prvi oglas
            </Link>
          </Show>
        </div>

        <Show when="signed-out">
          <section className="mt-7 rounded-lg border border-honey/30 bg-honey/16 p-5">
            <div className="flex gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-mossDark">
                <UserRound aria-hidden="true" size={21} />
              </span>
              <div>
                <h2 className="text-xl font-black text-ink">Prijavi se za svoje oglase</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/68">
                  Prijavi se da možeš objaviti i kasnije urediti svoj oglas.
                </p>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="focus-ring mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
                  >
                    Prijava
                  </button>
                </SignInButton>
              </div>
            </div>
          </section>
        </Show>

        <Show when="signed-in">
          <section className="mt-7 rounded-lg border border-dashed border-ink/18 bg-white p-6">
            <h2 className="text-xl font-black text-ink">Još nema tvojih povezanih oglasa</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/64">
              Kad objaviš prvi oglas, moći ćeš ga pronaći ovdje i pratiti njegov status.
            </p>
            <Link
              href="/novi-oglas"
              className="focus-ring mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
            >
              <PlusCircle aria-hidden="true" size={18} />
              Objavi prvi oglas
            </Link>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-black text-ink">Demo prikaz</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {userDemoListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        </Show>
      </div>
    </main>
  );
}

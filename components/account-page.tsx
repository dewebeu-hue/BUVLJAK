"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  AlertCircle,
  Download,
  FileText,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Trash2,
  UserRound
} from "lucide-react";

import { AdvertiserProfileForm } from "@/components/advertiser-profile-form";

const privacyMailHref =
  "mailto:deweb.eu@gmail.com?subject=Zahtjev%20za%20privatnost%20i%20podatke%20-%20Buvljak.hr";
const deleteAccountHref =
  "mailto:deweb.eu@gmail.com?subject=Zahtjev%20za%20brisanje%20racuna%20-%20Buvljak.hr";
const exportDataHref =
  "mailto:deweb.eu@gmail.com?subject=Zahtjev%20za%20izvoz%20podataka%20-%20Buvljak.hr";

const legalLinks = [
  { href: "/pravila-privatnosti", label: "Pravila privatnosti" },
  { href: "/kolacici", label: "Kolačići" },
  { href: "/uvjeti-koristenja", label: "Uvjeti korištenja" },
  { href: "/kontakt", label: "Kontakt" }
];

export function AccountPage() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <main className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="h-6 w-28 rounded-full bg-ink/8" />
          <div className="mt-4 h-10 w-64 rounded-lg bg-ink/8" />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="h-44 rounded-lg bg-ink/8" />
            <div className="h-44 rounded-lg bg-ink/8" />
          </div>
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-lg border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
          <span className="inline-flex rounded-full bg-moss/10 px-3 py-1 text-sm font-black text-mossDark">
            Moj račun
          </span>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-moss/10 text-mossDark">
              <LockKeyhole aria-hidden="true" size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-black leading-tight text-ink">Prijavi se za pristup računu</h1>
              <p className="mt-3 text-base font-semibold leading-relaxed text-ink/66">
                Tvoj račun prikazuje osnovne podatke, privatnost i linkove za upravljanje podacima.
              </p>
              <SignInButton mode="modal" fallbackRedirectUrl="/moj-racun" forceRedirectUrl="/moj-racun">
                <button
                  type="button"
                  className="focus-ring mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
                >
                  <UserRound aria-hidden="true" size={18} />
                  Prijavi se
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const displayName = user?.fullName || user?.firstName || user?.username;
  const email = user?.primaryEmailAddress?.emailAddress;
  const accountFields = [
    ...(displayName ? [{ label: "Ime", value: displayName }] : []),
    ...(email ? [{ label: "Email", value: email }] : []),
    { label: "Status prijave", value: "Prijavljen/a" }
  ];

  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <span className="inline-flex rounded-full bg-moss/10 px-3 py-1 text-sm font-black text-mossDark">
          Moj račun
        </span>
        <div className="mt-3">
          <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">Moj račun</h1>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-relaxed text-ink/66">
            Ovdje upravljaš osnovnim podacima, privatnošću i zahtjevima vezanim uz račun.
          </p>
        </div>

        <section className="mt-8 rounded-lg border border-ink/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-moss/10 text-mossDark">
              <UserRound aria-hidden="true" size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-black leading-tight text-ink">Osnovni podaci</h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/64">
                Podaci dolaze iz prijave i koriste se za povezivanje računa s oglasima.
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            {accountFields.map((field) => (
              <AccountField key={field.label} label={field.label} value={field.value} />
            ))}
          </dl>
        </section>

        <div className="mt-5">
          <AdvertiserProfileForm />
        </div>

        <section className="mt-5 rounded-lg border border-ink/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-clay/10 text-clay">
              <ShieldCheck aria-hidden="true" size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-black leading-tight text-ink">Privatnost i podaci</h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/64">
                Za zatvorenu betu zahtjevi za brisanje računa i izvoz podataka obrađuju se ručno preko
                emaila. Pošalji zahtjev s email adrese kojom koristiš Buvljak.hr.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <a
              href={deleteAccountHref}
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-clay/20 bg-clay/8 px-4 py-2 text-sm font-black text-clay transition hover:bg-clay/12"
            >
              <Trash2 aria-hidden="true" size={18} />
              Zatraži brisanje računa
            </a>
            <a
              href={exportDataHref}
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-4 py-2 text-sm font-black text-ink transition hover:bg-field"
            >
              <Download aria-hidden="true" size={18} />
              Zatraži izvoz podataka
            </a>
            <a
              href={privacyMailHref}
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink/12 bg-white px-4 py-2 text-sm font-black text-ink transition hover:bg-field sm:col-span-2"
            >
              <Mail aria-hidden="true" size={18} />
              Pošalji zahtjev za privatnost
            </a>
          </div>

          <p className="mt-4 text-xs font-bold leading-relaxed text-ink/52">
            Automatsko brisanje nije uključeno u MVP-u kako bi se prije obrade moglo provjeriti da
            zahtjev dolazi od stvarnog vlasnika računa.
          </p>
        </section>

        <section className="mt-5 rounded-lg border border-clay/20 bg-clay/8 p-5 sm:p-6">
          <div className="flex gap-3">
            <AlertCircle aria-hidden="true" size={22} className="mt-0.5 shrink-0 text-clay" />
            <div>
              <h2 className="text-xl font-black leading-tight text-ink">Sigurnosna napomena</h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/68">
                Brisanje računa može zahtijevati dodatnu provjeru identiteta. Neki podaci mogu se
                privremeno čuvati ako je to potrebno radi sigurnosti, sprječavanja zloupotrebe ili
                zakonskih obveza.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-ink/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink/6 text-ink">
              <FileText aria-hidden="true" size={20} />
            </div>
            <h2 className="text-2xl font-black leading-tight text-ink">Pravni linkovi</h2>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="focus-ring inline-flex min-h-11 items-center justify-between rounded-lg border border-ink/12 bg-white px-4 py-2 text-sm font-black text-ink transition hover:bg-field"
              >
                {link.label}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function AccountField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-field px-4 py-3">
      <dt className="text-xs font-black uppercase text-ink/50">{label}</dt>
      <dd className="mt-1 break-words text-sm font-black text-ink">{value}</dd>
    </div>
  );
}

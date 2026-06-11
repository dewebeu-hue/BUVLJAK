import Image from "next/image";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  CheckCircle2,
  CircleDollarSign,
  Gift,
  Megaphone,
  Repeat2,
  Search
} from "lucide-react";
import { ListingsExplorer } from "@/components/listings-explorer";

const actionCards = [
  {
    title: "Prodajem",
    text: "Oglas za stvari koje čekaju novog vlasnika.",
    icon: CircleDollarSign,
    tone: "bg-moss text-white"
  },
  {
    title: "Poklanjam",
    text: "Brzo ponudi ono što nekome u blizini može trebati.",
    icon: Gift,
    tone: "bg-honey text-ink"
  },
  {
    title: "Mijenjam",
    text: "Dogovori zamjenu bez dugih razgovora i profila.",
    icon: Repeat2,
    tone: "bg-plum text-white"
  },
  {
    title: "Tražim",
    text: "Napiši što ti treba i pusti lokalnu mrežu da radi.",
    icon: Search,
    tone: "bg-clay text-white"
  }
];

const howItWorks = [
  "Objavi ili pronađi oglas",
  "Podijeli ga u Facebook/WhatsApp grupu",
  "Kontaktiraj direktno, bez chata u aplikaciji"
];

const whyItems = [
  "lokalni feed aktivnih oglasa",
  "jednostavni filteri",
  "oglasi se mogu označiti kao riješeni",
  "bez nepotrebnog chata i kompliciranih profila"
];

export default async function HomePage() {
  const user = await currentUser();

  if (user) {
    return <ListingsExplorer />;
  }

  return <LandingPage />;
}

function LandingPage() {
  return (
    <main>
      <section className="hero-image">
        <div className="hero-visual" aria-hidden="true">
          <Image
            src="/buvljak-hero-landing.png"
            alt=""
            fill
            priority
            quality={90}
            unoptimized
            sizes="(max-width: 767px) 118vw, 72vw"
          />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[520px] max-w-6xl items-start px-4 pb-44 pt-10 sm:px-6 md:min-h-[620px] md:items-center md:py-12 lg:min-h-[660px]">
          <div className="hero-copy max-w-xl text-ink">
            <h1 className="max-w-xl text-4xl font-black leading-[1.05] text-[#1F2933] sm:text-5xl">
              <span className="sr-only">Prodajem, poklanjam, mijenjam i tražim u tvojoj blizini</span>
              <span className="hero-rolodex-heading" aria-hidden="true">
                <span className="hero-rolodex-word">
                  <span className="hero-rolodex-track">
                    <span className="hero-rolodex-item">Prodajem</span>
                    <span className="hero-rolodex-item">Poklanjam</span>
                    <span className="hero-rolodex-item">Mijenjam</span>
                    <span className="hero-rolodex-item">Tražim</span>
                    <span className="hero-rolodex-item">Prodajem</span>
                  </span>
                </span>
                <span className="hero-rolodex-static">u tvojoj blizini</span>
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg font-bold leading-relaxed text-ink/72 sm:text-xl">
              Složi oglas, podijeli ga u grupu ili pronađi nešto zanimljivo u blizini.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/oglasi"
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-honey px-5 text-base font-black text-ink transition hover:bg-[#ffd45f]"
              >
                Pogledaj oglase
                <ArrowRight aria-hidden="true" size={19} />
              </Link>
              <Link
                href="/novi-oglas"
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-moss/18 bg-white/82 px-5 text-base font-black text-mossDark shadow-sm transition hover:bg-white"
              >
                <Megaphone aria-hidden="true" size={19} />
                Objavi oglas
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fbfcf7] px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actionCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href="/oglasi"
                className="focus-ring group rounded-lg border border-ink/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
              >
                <span className={`grid h-12 w-12 place-items-center rounded-lg ${card.tone}`}>
                  <Icon aria-hidden="true" size={23} />
                </span>
                <h2 className="mt-5 text-xl font-black text-ink">{card.title}</h2>
                <p className="mt-2 min-h-12 text-sm leading-relaxed text-ink/66">{card.text}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-mossDark">
                  Otvori feed
                  <ArrowRight aria-hidden="true" size={16} className="transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-ink/8 bg-skywash/55 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-black text-ink">Kako radi</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {howItWorks.map((step, index) => (
              <div key={step} className="rounded-lg border border-moss/12 bg-white p-5">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-moss text-base font-black text-white">
                  {index + 1}
                </span>
                <p className="mt-4 text-lg font-black leading-snug text-ink">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-black text-ink">Zašto Buvljak?</h2>
            <p className="mt-4 text-base leading-relaxed text-ink/68">
              Dovoljno poznat za ljude koji već koriste lokalne grupe, ali čišći i lakši za
              pregled kad samo želiš vidjeti što je aktivno u blizini.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {whyItems.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-ink/10 bg-white p-4">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-moss" size={20} />
                <span className="font-bold leading-relaxed text-ink/78">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-lg border border-honey/30 bg-honey/16 p-5 text-ink sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <BadgeCheck aria-hidden="true" className="mt-1 shrink-0 text-mossDark" size={22} />
            <p className="font-bold leading-relaxed">
              Buvljak je beta alat. Dogovor i razmjena odvijaju se direktno između korisnika.
            </p>
          </div>
          <Link
            href="/oglasi"
            className="focus-ring inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-black text-white transition hover:bg-mossDark"
          >
            <Bookmark aria-hidden="true" size={17} />
            Kreni u pregled
          </Link>
        </div>
      </section>
    </main>
  );
}

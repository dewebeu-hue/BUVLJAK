import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import {
  ArrowRight,
  BadgeCheck,
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
    text: "Objavi stvar koju više ne koristiš.",
    cta: "Objavi prodaju",
    icon: CircleDollarSign,
    tone: "border-moss/16 bg-moss/12 text-mossDark",
    href: "/novi-oglas?type=sell"
  },
  {
    title: "Poklanjam",
    text: "Pokloni nekome iz blizine.",
    cta: "Pokloni stvar",
    icon: Gift,
    tone: "border-honey/34 bg-honey/22 text-ink",
    href: "/novi-oglas?type=give"
  },
  {
    title: "Mijenjam",
    text: "Predloži zamjenu kao na pravom buvljaku.",
    cta: "Predloži zamjenu",
    icon: Repeat2,
    tone: "border-plum/16 bg-plum/12 text-plum",
    href: "/novi-oglas?type=swap"
  },
  {
    title: "Tražim",
    text: "Napiši što ti treba i prati ponude.",
    cta: "Dodaj potragu",
    icon: Search,
    tone: "border-clay/16 bg-clay/12 text-clay",
    href: "/novi-oglas?type=want"
  }
];

const howItWorks = [
  {
    title: "Objavi ili pronađi oglas",
    text: "Kreni od stvari koju imaš ili od onoga što tražiš u blizini."
  },
  {
    title: "Pošalji ponudu ili kontaktiraj",
    text: "Javi se kratko i dogovori detalje bez dodatnog chata u aplikaciji."
  },
  {
    title: "Dogovori preuzimanje direktno",
    text: "Preuzimanje, cijena i vrijeme ostaju stvar dogovora između ljudi."
  }
];

const whyItems = [
  {
    title: "Lokalno i jednostavno",
    text: "Fokus je na Novoj Gradiški i okolici, bez kompliciranih profila."
  },
  {
    title: "Bez beskonačnog skrolanja",
    text: "Aktivni oglasi su pregledniji od poruka koje se izgube u grupi."
  },
  {
    title: "Dogovor direktno između ljudi",
    text: "Buvljak olakšava prvi kontakt, a dogovor nastavljaš izravno."
  }
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
        <div className="hero-visual" aria-hidden="true" />

        <div className="relative z-10 mx-auto flex max-w-6xl items-start px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8 md:min-h-[600px] md:items-center md:py-12 lg:min-h-[620px]">
          <div className="hero-copy max-w-xl text-ink">
            <span className="inline-flex rounded-full border border-moss/14 bg-white/76 px-3 py-1 text-sm font-black text-mossDark shadow-sm">
              Beta za Novu Gradišku i okolicu.
            </span>
            <h1 className="mt-5 max-w-xl text-4xl font-black leading-[1.05] text-[#1F2933] sm:text-5xl">
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
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-moss px-5 text-base font-black text-white shadow-sm transition hover:bg-mossDark"
              >
                Vidi što se nudi
                <ArrowRight aria-hidden="true" size={19} />
              </Link>
              <Link
                href="/novi-oglas"
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-moss/18 bg-white/76 px-5 text-base font-black text-mossDark transition hover:bg-white"
              >
                <Megaphone aria-hidden="true" size={19} />
                Objavi za 1 minutu
              </Link>
            </div>

            <div
              className="mt-5 grid grid-cols-2 gap-2 sm:hidden"
              aria-label="Osnovne radnje na Buvljak.hr"
            >
              {actionCards.map((card) => {
                const Icon = card.icon;

                return (
                  <Link
                    key={card.title}
                    href={card.href}
                    aria-label={`${card.cta} na Buvljak.hr`}
                    className={`focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:border-moss/24 active:translate-y-0 ${card.tone}`}
                  >
                    <Icon aria-hidden="true" size={16} />
                    {card.title}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fbfcf7] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-black text-ink sm:text-3xl">Što želiš napraviti?</h2>
            <p className="mt-3 text-base font-bold leading-relaxed text-ink/66">
              Odaberi radnju i složi oglas bez osjećaja velikog oglasnika.
            </p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {actionCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  aria-label={`${card.cta} na Buvljak.hr`}
                  className="focus-ring group flex h-full flex-col rounded-lg border border-ink/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-moss/24 hover:shadow-soft active:translate-y-0"
                >
                  <span className={`grid h-12 w-12 place-items-center rounded-lg border ${card.tone}`}>
                    <Icon aria-hidden="true" size={23} />
                  </span>
                  <h2 className="mt-5 text-xl font-black text-ink">{card.title}</h2>
                  <p className="mt-2 min-h-11 text-sm font-bold leading-relaxed text-ink/66">{card.text}</p>
                  <span className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-moss/16 bg-field px-3 text-sm font-black text-mossDark transition group-hover:border-moss/34 group-hover:bg-moss group-hover:text-white">
                    {card.cta}
                    <ArrowRight aria-hidden="true" size={16} className="transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-ink/8 bg-skywash/55 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-black text-ink">Kako radi</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {howItWorks.map((step, index) => (
              <div key={step.title} className="rounded-lg border border-moss/12 bg-white p-5">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-moss text-base font-black text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-black leading-snug text-ink">{step.title}</h3>
                <p className="mt-2 text-sm font-bold leading-relaxed text-ink/64">{step.text}</p>
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
          <div className="grid gap-3 md:grid-cols-3">
            {whyItems.map((item) => (
              <div key={item.title} className="rounded-lg border border-ink/10 bg-white p-4">
                <div className="flex items-center gap-3">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-moss" size={20} />
                  <h3 className="font-black leading-snug text-ink">{item.title}</h3>
                </div>
                <p className="mt-3 text-sm font-bold leading-relaxed text-ink/64">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-lg border border-ink/8 bg-white/72 p-4 text-ink shadow-sm">
          <div className="flex gap-3">
            <BadgeCheck aria-hidden="true" className="mt-0.5 shrink-0 text-mossDark" size={20} />
            <p className="text-sm font-bold leading-relaxed text-ink/72">
              Buvljak.hr ne sudjeluje u plaćanju ni dostavi. Dogovor obavljaš direktno s drugom osobom.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

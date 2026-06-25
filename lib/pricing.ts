import { supportMailtoHref } from "@/lib/contact";

export const FREE_DAILY_LISTING_LIMIT = 3;
export const FREE_ACTIVE_LISTING_LIMIT = 10;
export const FREE_AI_DAILY_LIMIT = 1;
export const FREE_AI_WEEKLY_LIMIT = 5;
export const FEATURED_WEEK_PRICE_EUR = 4.99;
export const FEATURED_WEEK_DAYS = 7;
export const FEATURED_ACTIVE_LISTING_LIMIT = 20;
export const FEATURED_WEEK_AI_CREDITS = 5;

export type PricingPlan = {
  id: "free" | "featured_week";
  name: string;
  priceLabel: string;
  eyebrow: string;
  summary: string;
  badge?: string;
  helperText?: string;
  features: string[];
  ctaLabel: string;
  ctaHref?: string;
  ctaNote?: string;
  isPrimary?: boolean;
};

export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Besplatno",
    priceLabel: "0 €",
    eyebrow: "Za obične oglase",
    summary: "Za povremene oglase u blizini.",
    features: [
      `do ${FREE_DAILY_LISTING_LIMIT} nova obična oglasa dnevno`,
      `do ${FREE_ACTIVE_LISTING_LIMIT} aktivnih oglasa`,
      `${FREE_AI_DAILY_LIMIT} AI prijedlog dnevno`,
      `do ${FREE_AI_WEEKLY_LIMIT} AI prijedloga tjedno`,
      "spremanje oglasa",
      "direktan kontakt izvan platforme"
    ],
    ctaLabel: "Objavi oglas",
    ctaHref: "/novi-oglas"
  },
  {
    id: "featured_week",
    name: "Beta isticanje oglasa",
    priceLabel: `${FEATURED_WEEK_PRICE_EUR.toLocaleString("hr-HR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} € / ${FEATURED_WEEK_DAYS} dana`,
    eyebrow: "Istaknuti oglas",
    summary: "Za važnije oglase koje želiš dodatno pogurati.",
    badge: "Najbolje za skuplje stvari",
    helperText: "npr. peć, bicikl, namještaj, alat, mobitel",
    features: [
      `1 istaknuti oglas na ${FEATURED_WEEK_DAYS} dana`,
      "oznaka “Istaknuto”",
      "ručna beta aktivacija nakon dogovora",
      `do ${FEATURED_ACTIVE_LISTING_LIMIT} aktivnih oglasa tijekom beta isticanja`,
      `do ${FREE_DAILY_LISTING_LIMIT} nova obična oglasa dnevno`,
      `${FEATURED_WEEK_AI_CREDITS} AI prijedloga za bolji naslov, opis i cijenu`,
      "tekst za Facebook grupu"
    ],
    ctaLabel: "Zatraži isticanje",
    ctaHref: supportMailtoHref("Zatraži isticanje oglasa na Buvljak.hr"),
    ctaNote:
      "Online plaćanje još nije uključeno. U beta fazi isticanje se aktivira ručno nakon dogovora.",
    isPrimary: true
  }
];

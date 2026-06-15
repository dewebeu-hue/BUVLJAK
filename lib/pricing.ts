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
  features: string[];
  ctaLabel: string;
  ctaHref?: string;
  isPrimary?: boolean;
};

export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Besplatno",
    priceLabel: "0 €",
    eyebrow: "Za obične oglase",
    summary: "Za prodaju, poklanjanje, zamjenu i potragu u blizini.",
    features: [
      `do ${FREE_DAILY_LISTING_LIMIT} nova obična oglasa dnevno`,
      `do ${FREE_ACTIVE_LISTING_LIMIT} aktivnih oglasa`,
      `${FREE_AI_DAILY_LIMIT} AI prijedlog dnevno`,
      `do ${FREE_AI_WEEKLY_LIMIT} AI prijedloga tjedno`,
      "spremanje oglasa ako je dostupno",
      "direktan kontakt izvan platforme"
    ],
    ctaLabel: "Objavi oglas",
    ctaHref: "/novi-oglas"
  },
  {
    id: "featured_week",
    name: "Istakni oglas",
    priceLabel: `${FEATURED_WEEK_PRICE_EUR.toLocaleString("hr-HR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} € / ${FEATURED_WEEK_DAYS} dana`,
    eyebrow: "Beta isticanje",
    summary: "Za oglase koje želiš jače istaknuti kada feature bude aktivan.",
    features: [
      `1 istaknuti oglas na ${FEATURED_WEEK_DAYS} dana`,
      "oznaka “Istaknuto”",
      "bolja vidljivost u feedu kada feature bude aktivan",
      `do ${FREE_DAILY_LISTING_LIMIT} nova obična oglasa dnevno tijekom tog perioda`,
      `do ${FEATURED_ACTIVE_LISTING_LIMIT} aktivnih oglasa`,
      `${FEATURED_WEEK_AI_CREDITS} AI prijedloga uključeno u 7 dana`
    ],
    ctaLabel: "Zatraži isticanje",
    ctaHref: "/kontakt",
    isPrimary: true
  }
];

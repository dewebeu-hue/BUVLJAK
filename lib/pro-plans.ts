export type ProPlanConfig = {
  id: "pro_mini" | "pro_local" | "pro_plus";
  name: string;
  priceLabel: string;
  summary: string;
  features: string[];
};

export const proPlans: ProPlanConfig[] = [
  {
    id: "pro_mini",
    name: "Pro Mini",
    priceLabel: "5 EUR / mjesec",
    summary: "Za povremene prodavače koji žele malo bolju vidljivost.",
    features: ["Do 3 istaknuta oglasa", "Oznaka profila", "Pregled osnovnih upita"]
  },
  {
    id: "pro_local",
    name: "Pro Local",
    priceLabel: "15 EUR / mjesec",
    summary: "Za lokalne obrte, OPG-ove i male trgovce.",
    features: ["Do 10 istaknutih oglasa", "Lokalni opis profila", "Prioritetna podrška"]
  },
  {
    id: "pro_plus",
    name: "Pro Plus",
    priceLabel: "29 EUR / mjesec",
    summary: "Za korisnike s većim brojem aktivnih oglasa.",
    features: ["Veći limit aktivnih oglasa", "Top oznake za odabrane oglase", "Beta pristup novim alatima"]
  }
];

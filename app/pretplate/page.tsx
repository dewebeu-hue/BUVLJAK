import type { Metadata } from "next";
import { PricingPage } from "@/components/pricing-page";

export const metadata: Metadata = {
  title: "Pretplate | Buvljak",
  description: "Buvljak beta paketi i isticanje oglasa bez online plaćanja u MVP-u."
};

export default function PretplatePage() {
  return <PricingPage />;
}

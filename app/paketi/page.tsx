import type { Metadata } from "next";
import { ProPlansPage } from "@/components/pro-plans-page";

export const metadata: Metadata = {
  title: "Paketi | Buvljak",
  description: "Buvljak paketi trenutno nisu dostupni u zatvorenoj beti."
};

export default function PaketiPage() {
  return <ProPlansPage />;
}

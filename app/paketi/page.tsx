import type { Metadata } from "next";
import { ProPlansPage } from "@/components/pro-plans-page";

export const metadata: Metadata = {
  title: "Paketi | Buvljak",
  description: "Buvljak pro paketi za aktivnije lokalno oglašavanje."
};

export default function PaketiPage() {
  return <ProPlansPage />;
}

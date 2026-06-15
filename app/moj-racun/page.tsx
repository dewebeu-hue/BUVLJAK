import type { Metadata } from "next";
import { AccountPage } from "@/components/account-page";

export const metadata: Metadata = {
  title: "Moj račun | Buvljak.hr",
  description: "Osnovni podaci, privatnost i linkovi za tvoj Buvljak.hr račun."
};

export default function MojRacunPage() {
  return <AccountPage />;
}

import Link from "next/link";
import { NeedsEdit } from "@/components/legal-page";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-white px-4 py-7 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm font-bold text-ink/58 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/pravila" className="transition hover:text-mossDark">
            Pravila korištenja
          </Link>
          <Link href="/privatnost" className="transition hover:text-mossDark">
            Privatnost
          </Link>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          <p>
            Kontakt: <NeedsEdit>[UPIŠI EMAIL]</NeedsEdit>
          </p>
          <p className="text-xs font-bold text-ink/45">
            © 2026 Buvljak.hr · lokalni projekt by{" "}
            <a href="https://deweb.hr" className="transition hover:text-mossDark">
              deweb
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

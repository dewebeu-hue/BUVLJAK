import Link from "next/link";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/contact";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-white px-4 py-7 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm font-bold text-ink/58 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-base font-black text-ink">Buvljak.hr beta</p>
          <p className="mt-1 text-sm font-bold text-ink/58">Nova Gradiška i okolica</p>
          <p className="mt-1 text-sm font-bold text-ink/58">Upravitelj: deweb j.d.o.o.</p>
        </div>

        <nav aria-label="Pravne i sigurnosne stranice" className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/uvjeti-koristenja" className="transition hover:text-mossDark">
            Uvjeti korištenja
          </Link>
          <Link href="/pravila-privatnosti" className="transition hover:text-mossDark">
            Pravila privatnosti
          </Link>
          <Link href="/kolacici" className="transition hover:text-mossDark">
            Kolačići
          </Link>
          <Link href="/kontakt" className="transition hover:text-mossDark">
            Kontakt
          </Link>
          <Link href="/sigurnost" className="transition hover:text-mossDark">
            Sigurnost
          </Link>
        </nav>

        <div className="flex flex-col gap-1 lg:items-end">
          <p>
            Kontakt:{" "}
            <a href={SUPPORT_MAILTO} className="transition hover:text-mossDark">
              {SUPPORT_EMAIL}
            </a>
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

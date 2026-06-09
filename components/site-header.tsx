"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle, ShieldCheck, Store, ScrollText } from "lucide-react";

const navItems = [
  { href: "/oglasi", label: "Oglasi", icon: ScrollText },
  { href: "/novi-oglas", label: "Novi oglas", icon: PlusCircle },
  { href: "/admin", label: "Admin", icon: ShieldCheck }
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-[#fbfcf7]/92 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="focus-ring flex min-w-0 items-center gap-2 rounded-lg">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-moss text-white shadow-soft">
            <Store aria-hidden="true" size={21} strokeWidth={2.3} />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-black leading-tight text-ink">Buvljak</span>
            <span className="hidden text-xs font-semibold text-ink/62 sm:block">
              Beta · Nova Gradiška i okolica
            </span>
          </span>
        </Link>

        <nav aria-label="Glavna navigacija" className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href === "/oglasi" && pathname.startsWith("/oglasi"));

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`focus-ring inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold transition ${
                  isActive
                    ? "bg-moss/10 text-mossDark"
                    : "text-ink/74 hover:bg-ink/6 hover:text-ink"
                }`}
              >
                <Icon aria-hidden="true" size={17} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

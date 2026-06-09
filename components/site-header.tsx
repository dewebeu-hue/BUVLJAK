"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
  SignOutButton,
  UserButton,
  useUser
} from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogIn,
  LogOut,
  PlusCircle,
  ScrollText,
  ShieldCheck,
  Store,
  UserRound
} from "lucide-react";

const navItems = [
  { href: "/oglasi", label: "Oglasi", icon: ScrollText },
  { href: "/admin", label: "Admin", icon: ShieldCheck }
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-[#fbfcf7]/92 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
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

        <HeaderAuth pathname={pathname} />
      </div>
    </header>
  );
}

function HeaderAuth({ pathname }: { pathname: string }) {
  const { user } = useUser();
  const displayName =
    user?.firstName ?? user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Korisnik";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button
            type="button"
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-field"
          >
            <LogIn aria-hidden="true" size={16} />
            Prijava
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button
            type="button"
            className="focus-ring hidden h-10 items-center gap-2 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-field md:inline-flex"
          >
            Registracija
          </button>
        </SignUpButton>
        <SignInButton mode="modal">
          <button
            type="button"
            className="focus-ring hidden h-10 items-center gap-2 rounded-lg bg-moss px-3 text-sm font-black text-white transition hover:bg-mossDark sm:inline-flex"
          >
            <PlusCircle aria-hidden="true" size={16} />
            Objavi oglas
          </button>
        </SignInButton>
      </Show>

      <Show when="signed-in">
        <Link
          href="/moji-oglasi"
          aria-current={pathname === "/moji-oglasi" ? "page" : undefined}
          className={`focus-ring hidden h-10 items-center gap-2 rounded-lg px-3 text-sm font-black transition sm:inline-flex ${
            pathname === "/moji-oglasi"
              ? "bg-moss/10 text-mossDark"
              : "border border-ink/12 bg-white text-ink hover:bg-field"
          }`}
        >
          <UserRound aria-hidden="true" size={16} />
          Moji oglasi
        </Link>
        <Link
          href="/novi-oglas"
          aria-current={pathname === "/novi-oglas" ? "page" : undefined}
          className={`focus-ring inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-black transition ${
            pathname === "/novi-oglas" ? "bg-moss/10 text-mossDark" : "bg-moss text-white hover:bg-mossDark"
          }`}
        >
          <PlusCircle aria-hidden="true" size={16} />
          <span className="hidden sm:inline">Novi oglas</span>
        </Link>
        <span className="hidden max-w-32 truncate text-sm font-black text-ink/72 lg:inline">
          {displayName}
        </span>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-honey/24 text-xs font-black text-ink sm:hidden">
          {initials}
        </span>
        <UserButton />
        <SignOutButton>
          <button
            type="button"
            className="focus-ring hidden h-10 items-center gap-2 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-field md:inline-flex"
          >
            <LogOut aria-hidden="true" size={16} />
            Odjava
          </button>
        </SignOutButton>
      </Show>
    </div>
  );
}

"use client";

import {
  Show,
  SignInButton,
  SignOutButton,
  SignUpButton,
  UserButton,
  useUser
} from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleDollarSign,
  Gift,
  LogIn,
  LogOut,
  Menu,
  PlusCircle,
  Repeat2,
  ScrollText,
  Search,
  SearchCheck,
  UserRound,
  X
} from "lucide-react";
import { FacebookAuthButton } from "@/components/facebook-auth-button";

const navItems = [{ href: "/oglasi", label: "Oglasi", icon: ScrollText }];
const mobileMenuToggleId = "mobile-site-menu-toggle";

const mobileMenuLinks = [
  { href: "/oglasi", label: "Oglasi", icon: ScrollText },
  { href: "/oglasi?type=sell", label: "Prodajem", icon: CircleDollarSign },
  { href: "/oglasi?type=give", label: "Poklanjam", icon: Gift },
  { href: "/oglasi?type=swap", label: "Mijenjam", icon: Repeat2 },
  { href: "/oglasi?type=want", label: "Tražim", icon: Search }
];

export function SiteHeader() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();
  const showSignedInMobileMenu = isLoaded && isSignedIn;

  function closeMobileMenu() {
    const mobileMenuToggle = document.getElementById(mobileMenuToggleId);

    if (mobileMenuToggle instanceof HTMLInputElement) {
      mobileMenuToggle.checked = false;
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-[#fbfcf7]/92 backdrop-blur">
      <input
        id={mobileMenuToggleId}
        type="checkbox"
        aria-controls="mobile-site-menu"
        aria-label="Mobilni izbornik"
        className="mobile-menu-toggle sr-only"
      />
      <div className="site-header-bar mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="focus-ring flex min-w-0 items-center gap-2 rounded-lg">
          <span className="min-w-0">
            <Image
              src="/buvljak-logo.svg"
              alt="Buvljak"
              width={190}
              height={56}
              priority
              className="block h-10 w-auto max-w-[150px] sm:h-11 sm:max-w-[190px]"
            />
            <span className="block text-xs font-semibold text-ink/62">
              Beta · Nova Gradiška i okolica
            </span>
          </span>
        </Link>

        <nav aria-label="Glavna navigacija" className="hidden items-center gap-1 sm:flex">
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
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <HeaderAuth pathname={pathname} />

        <div className="sm:hidden">
          <label
            htmlFor={mobileMenuToggleId}
            aria-label="Otvori izbornik"
            className="mobile-menu-trigger mobile-menu-trigger-open focus-ring inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-ink/12 bg-white text-ink shadow-sm transition hover:bg-field"
          >
            <Menu aria-hidden="true" size={22} />
          </label>
          <label
            htmlFor={mobileMenuToggleId}
            aria-label="Zatvori izbornik"
            className="mobile-menu-trigger mobile-menu-trigger-close focus-ring h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-ink/12 bg-white text-ink shadow-sm transition hover:bg-field"
          >
            <X aria-hidden="true" size={22} />
          </label>
        </div>
      </div>

      <div className="mobile-menu-shell sm:hidden">
        <label
          htmlFor={mobileMenuToggleId}
          aria-label="Zatvori izbornik"
          className="absolute inset-x-0 top-full z-[45] block h-screen cursor-default bg-ink/18"
        />
        <div
          id="mobile-site-menu"
          className="absolute inset-x-3 top-full z-[46] rounded-lg border border-ink/10 bg-white p-3 shadow-soft"
        >
          <nav aria-label="Mobilna navigacija" className="grid gap-1.5">
            {mobileMenuLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className="focus-ring flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-black text-ink transition hover:bg-field"
                >
                  <Icon aria-hidden="true" size={18} className="text-mossDark" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-3 border-t border-ink/8 pt-3">
            {showSignedInMobileMenu ? (
              <div className="grid gap-2">
                <Link
                  href="/moje-potrage"
                  onClick={closeMobileMenu}
                  className="focus-ring flex h-11 items-center gap-3 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-field"
                >
                  <SearchCheck aria-hidden="true" size={18} />
                  Moje potrage
                </Link>
                <Link
                  href="/moji-oglasi"
                  onClick={closeMobileMenu}
                  className="focus-ring flex h-11 items-center gap-3 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-field"
                >
                  <UserRound aria-hidden="true" size={18} />
                  Moji oglasi
                </Link>
                <Link
                  href="/novi-oglas"
                  onClick={closeMobileMenu}
                  className="focus-ring flex h-11 items-center gap-3 rounded-lg bg-moss px-3 text-sm font-black text-white transition hover:bg-mossDark"
                >
                  <PlusCircle aria-hidden="true" size={18} />
                  Objavi oglas
                </Link>
                <SignOutButton>
                  <button
                    type="button"
                    onClick={closeMobileMenu}
                    className="focus-ring flex h-11 items-center gap-3 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-field"
                  >
                    <LogOut aria-hidden="true" size={18} />
                    Odjava
                  </button>
                </SignOutButton>
              </div>
            ) : (
              <div className="grid gap-2">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    onClick={closeMobileMenu}
                    className="focus-ring flex h-11 items-center gap-3 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black text-ink transition hover:bg-field"
                  >
                    <LogIn aria-hidden="true" size={18} />
                    Prijava
                  </button>
                </SignInButton>
                <div onClickCapture={closeMobileMenu}>
                  <FacebookAuthButton
                    redirectUrlComplete={pathname || "/"}
                    className="w-full [&>button]:w-full"
                  >
                    Facebook prijava
                  </FacebookAuthButton>
                </div>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    onClick={closeMobileMenu}
                    className="focus-ring flex h-11 items-center gap-3 rounded-lg bg-moss px-3 text-sm font-black text-white transition hover:bg-mossDark"
                  >
                    <PlusCircle aria-hidden="true" size={18} />
                    Objavi oglas
                  </button>
                </SignInButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderAuth({ pathname }: { pathname: string }) {
  const { user } = useUser();
  const displayName =
    user?.firstName ?? user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Korisnik";

  return (
    <div className="hidden min-w-0 items-center gap-1.5 sm:flex">
      <Show when="signed-out">
        <FacebookAuthButton
          redirectUrlComplete={pathname || "/"}
          variant="header"
          className="hidden md:inline-flex"
        >
          Facebook
        </FacebookAuthButton>
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
            className="focus-ring hidden h-10 items-center gap-2 rounded-lg bg-moss px-3 text-sm font-black text-white transition hover:bg-mossDark md:inline-flex"
          >
            <PlusCircle aria-hidden="true" size={16} />
            Objavi oglas
          </button>
        </SignInButton>
      </Show>

      <Show when="signed-in">
        <Link
          href="/moje-potrage"
          aria-current={pathname === "/moje-potrage" ? "page" : undefined}
          className={`focus-ring inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-black transition ${
            pathname === "/moje-potrage"
              ? "bg-moss/10 text-mossDark"
              : "border border-ink/12 bg-white text-ink hover:bg-field"
          }`}
        >
          <SearchCheck aria-hidden="true" size={16} />
          <span className="hidden lg:inline">Moje potrage</span>
          <span className="sr-only lg:hidden">Moje potrage</span>
        </Link>
        <Link
          href="/moji-oglasi"
          aria-current={pathname === "/moji-oglasi" ? "page" : undefined}
          className={`focus-ring hidden h-10 items-center gap-2 rounded-lg px-3 text-sm font-black transition md:inline-flex ${
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
          <span className="hidden md:inline">Novi oglas</span>
        </Link>
        <span className="hidden max-w-32 truncate text-sm font-black text-ink/72 lg:inline">
          {displayName}
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

"use client";

import { Show, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Fragment, type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Bell, BookmarkPlus, CheckCircle2, Filter, Plus, Search, X } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { LocalSponsorStrip, type PublicLocalSponsor } from "@/components/local-sponsor-card";
import { useClientMounted } from "@/components/use-client-mounted";
import { api } from "@/convex/_generated/api";
import {
  demoListings,
  fromConvexListing,
  listingTypeFilterOptions,
  type Listing,
  type ListingType
} from "@/lib/listings";

const hasConvexUrl = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
const PAGE_SIZE = 20;
const savedSearchesEnabled = false;

type FeedFilters = {
  search: string;
  type: ListingType | "all";
  city: string;
  category: string;
  maxPrice: string;
};

function readInitialFeedFilters(): FeedFilters {
  if (typeof window === "undefined") {
    return {
      search: "",
      type: "all",
      city: "",
      category: "",
      maxPrice: ""
    };
  }

  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get("type");
  const type =
    typeParam === "sell" ||
    typeParam === "give" ||
    typeParam === "swap" ||
    typeParam === "want"
      ? typeParam
      : "all";

  return {
    search: params.get("q") ?? "",
    type,
    city: params.get("city") ?? "",
    category: params.get("category") ?? "",
    maxPrice: params.get("maxPrice") ?? ""
  };
}

export function ListingsExplorer() {
  const [initialFilters] = useState<FeedFilters>(() => readInitialFeedFilters());
  const [search, setSearch] = useState(initialFilters.search);
  const [type, setType] = useState<ListingType | "all">(initialFilters.type);
  const [city, setCity] = useState(initialFilters.city);
  const [category, setCategory] = useState(initialFilters.category);
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const isMounted = useClientMounted();

  const filters = useMemo<FeedFilters>(
    () => ({ search, type, city, category, maxPrice }),
    [category, city, maxPrice, search, type]
  );

  return (
    <main className="pb-28">
      <section className="border-b border-ink/8 bg-[#fbfcf7] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-moss/10 px-3 py-1 text-sm font-black text-mossDark">
                Nova Gradiška i okolica
              </span>
              <h1 className="mt-3 text-4xl font-black leading-tight text-ink">Aktivni oglasi</h1>
            </div>
            <Link
              href="/novi-oglas"
              className="focus-ring hidden h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark md:inline-flex"
            >
              <Plus aria-hidden="true" size={18} />
              Novi oglas
            </Link>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <label className="relative block">
              <span className="sr-only">Što tražiš?</span>
              <Search
                aria-hidden="true"
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/42"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Što tražiš?"
                className="focus-ring h-13 w-full rounded-lg border border-ink/12 bg-white py-3 pl-11 pr-4 text-base font-semibold text-ink placeholder:text-ink/42"
              />
            </label>

            <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Brzi filteri">
              {listingTypeFilterOptions.map((filter) => {
                const isActive = filter.value === type;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => {
                      setType(filter.value);
                      setLimit(PAGE_SIZE);
                    }}
                    className={`focus-ring h-11 shrink-0 rounded-full border px-4 text-sm font-black transition ${
                      isActive
                        ? "border-moss bg-moss text-white"
                        : "border-ink/12 bg-white text-ink/70 hover:bg-field"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <FilterInput label="Grad" value={city} onChange={setCity} placeholder="npr. Nova Gradiška" />
            <FilterInput
              label="Kategorija"
              value={category}
              onChange={setCategory}
              placeholder="npr. Namještaj"
            />
            <FilterInput
              label="Cijena do"
              value={maxPrice}
              onChange={setMaxPrice}
              placeholder="npr. 100"
              type="number"
            />
          </div>

          {savedSearchesEnabled ? <SavedSearchPrompt filters={filters} /> : null}
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {!hasConvexUrl ? (
            <ListingsResults
              listings={demoListings}
              filters={filters}
              canLoadMore={false}
              isLoading={false}
              onLoadMore={() => undefined}
              showFeatured={false}
              feedSponsors={[]}
            />
          ) : null}
          {hasConvexUrl && !isMounted ? <ListingsSkeleton /> : null}
          {hasConvexUrl && isMounted ? (
            <ConnectedListingsResults filters={filters} limit={limit} setLimit={setLimit} />
          ) : null}
        </div>
      </section>

      <Link
        href="/novi-oglas"
        className="focus-ring fixed bottom-4 left-4 right-4 z-30 inline-flex h-13 items-center justify-center gap-2 rounded-lg bg-clay px-5 text-base font-black text-white shadow-soft transition hover:bg-[#bd4c31] md:hidden"
      >
        <Plus aria-hidden="true" size={20} />
        + Novi oglas
      </Link>
    </main>
  );
}

function hasSearchIntent(filters: FeedFilters) {
  return Boolean(
    filters.search.trim() ||
      filters.type !== "all" ||
      filters.city.trim() ||
      filters.category.trim() ||
      filters.maxPrice.trim()
  );
}

function SavedSearchPrompt({ filters }: { filters: FeedFilters }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!hasSearchIntent(filters)) {
    return null;
  }

  return (
    <div className="mt-5 rounded-lg border border-moss/14 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-moss/10 text-mossDark">
            <Bell aria-hidden="true" size={19} />
          </span>
          <div>
            <p className="text-base font-black text-ink">Spremi ovu potragu</p>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/62">
              Spremi što tražiš, Buvljak ti javi kad se pojavi nešto slično.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
        >
          {isOpen ? <X aria-hidden="true" size={17} /> : <BookmarkPlus aria-hidden="true" size={17} />}
          Spremi potragu
        </button>
      </div>

      {isOpen ? (
        <div className="mt-4 border-t border-ink/8 pt-4">
          <Show when="signed-out">
            <div className="rounded-lg bg-honey/16 p-4">
              <p className="text-sm font-black text-ink">
                Prijavi se da možeš spremiti potragu i dobiti obavijest.
              </p>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="focus-ring mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
                >
                  Prijava
                </button>
              </SignInButton>
            </div>
          </Show>

          <Show when="signed-in">
            {hasConvexUrl ? (
              <ConnectedSavedSearchForm key={filtersKey(filters)} filters={filters} />
            ) : (
              <div className="rounded-lg bg-honey/16 p-4 text-sm font-semibold text-ink/68">
                Convex još nije povezan, pa spremanje potrage trenutno radi samo u pravoj bazi.
              </div>
            )}
          </Show>
        </div>
      ) : null}
    </div>
  );
}

function ConnectedSavedSearchForm({ filters }: { filters: FeedFilters }) {
  const createSavedSearch = useMutation(api.savedSearches.createSavedSearch);
  const [query, setQuery] = useState(filters.search);
  const [city, setCity] = useState(filters.city || "Nova Gradiška");
  const [category, setCategory] = useState(filters.category);
  const [type, setType] = useState<ListingType | "all">(filters.type);
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice);
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage("");

    const parsedMaxPrice = Number(maxPrice);

    try {
      await createSavedSearch({
        ...(query.trim() ? { query: query.trim() } : {}),
        ...(city.trim() ? { city: city.trim() } : {}),
        ...(category.trim() ? { category: category.trim() } : {}),
        ...(type !== "all" ? { type } : {}),
        ...(maxPrice.trim() && Number.isFinite(parsedMaxPrice) ? { maxPrice: parsedMaxPrice } : {}),
        notifyByEmail,
        isActive: true
      });
      setStatusMessage("Potraga je spremljena. Javit ćemo ti kad se pojavi nešto slično.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Potragu trenutno nije moguće spremiti."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <SavedSearchField label="Naziv/upit potrage" value={query} onChange={setQuery} placeholder="npr. perilica" />
        <SavedSearchField label="Grad" value={city} onChange={setCity} placeholder="Nova Gradiška" />
        <SavedSearchField label="Kategorija" value={category} onChange={setCategory} placeholder="npr. Namještaj" />
        <label className="block">
          <span className="mb-2 block text-sm font-black text-ink">Tip</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as ListingType | "all")}
            className="focus-ring h-11 w-full rounded-lg border border-ink/12 bg-white px-3 text-sm font-bold text-ink"
          >
            {listingTypeFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value === "all" ? "Svi tipovi" : option.label}
              </option>
            ))}
          </select>
        </label>
        <SavedSearchField
          label="Cijena do"
          value={maxPrice}
          onChange={setMaxPrice}
          placeholder="npr. 100"
          type="number"
        />
      </div>

      <label className="flex items-start gap-3 rounded-lg bg-field p-3">
        <input
          type="checkbox"
          checked={notifyByEmail}
          onChange={(event) => setNotifyByEmail(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-ink/20 accent-moss"
        />
        <span>
          <span className="block text-sm font-black text-ink">
            Pošalji mi email kad se pojavi nešto slično
          </span>
          <span className="mt-1 block text-xs font-semibold leading-relaxed text-ink/58">
            Email ne sadrži privatne kontakt podatke oglašivača.
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSaving}
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark disabled:cursor-not-allowed disabled:bg-ink/30"
        >
          <BookmarkPlus aria-hidden="true" size={17} />
          {isSaving ? "Spremanje..." : "Spremi potragu"}
        </button>
        {statusMessage ? (
          <p className="inline-flex items-center gap-2 text-sm font-black text-mossDark" aria-live="polite">
            <CheckCircle2 aria-hidden="true" size={17} />
            {statusMessage}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function SavedSearchField({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-ink">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={type === "number" ? 0 : undefined}
        className="focus-ring h-11 w-full rounded-lg border border-ink/12 bg-white px-3 text-sm font-bold text-ink placeholder:text-ink/38"
      />
    </label>
  );
}

function filtersKey(filters: FeedFilters) {
  return [
    filters.search,
    filters.type,
    filters.city,
    filters.category,
    filters.maxPrice
  ].join("|");
}

function ConnectedListingsResults({
  filters,
  limit,
  setLimit
}: {
  filters: FeedFilters;
  limit: number;
  setLimit: (next: number | ((current: number) => number)) => void;
}) {
  const maxPriceNumber = Number(filters.maxPrice);
  const queryArgs = {
    limit,
    ...(filters.type !== "all" ? { type: filters.type } : {}),
    ...(filters.city.trim() ? { city: filters.city.trim() } : {}),
    ...(filters.category.trim() ? { category: filters.category.trim() } : {}),
    ...(Number.isFinite(maxPriceNumber) && filters.maxPrice.trim()
      ? { maxPrice: maxPriceNumber }
      : {})
  };
  const convexListings = useQuery(api.listings.listActiveListings, queryArgs);
  const monetizationSettings = useQuery(api.monetization.getMonetizationSettings);
  const feedSponsors = useQuery(api.monetization.listVisibleLocalSponsors, {
    placement: "feed"
  }) as PublicLocalSponsor[] | undefined;
  const rawListings = useMemo<Listing[]>(
    () => convexListings?.map(fromConvexListing) ?? [],
    [convexListings]
  );

  return (
    <ListingsResults
      listings={rawListings}
      filters={filters}
      isLoading={convexListings === undefined}
      canLoadMore={convexListings !== undefined && rawListings.length >= limit}
      onLoadMore={() => setLimit((current) => current + PAGE_SIZE)}
      showFeatured={Boolean(monetizationSettings?.featuredListingsEnabled)}
      feedSponsors={feedSponsors ?? []}
    />
  );
}

function ListingsResults({
  listings,
  filters,
  isLoading,
  canLoadMore,
  onLoadMore,
  showFeatured,
  feedSponsors
}: {
  listings: Listing[];
  filters: FeedFilters;
  isLoading: boolean;
  canLoadMore: boolean;
  onLoadMore: () => void;
  showFeatured: boolean;
  feedSponsors: PublicLocalSponsor[];
}) {
  const filteredListings = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();
    const normalizedCity = filters.city.trim().toLowerCase();
    const normalizedCategory = filters.category.trim().toLowerCase();
    const parsedMaxPrice = Number(filters.maxPrice);

    return listings.filter((listing) => {
      const matchesSearch =
        !normalizedSearch ||
        `${listing.title} ${listing.description} ${listing.city} ${listing.category}`
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesType = filters.type === "all" || listing.type === filters.type;
      const matchesCity = !normalizedCity || listing.city.toLowerCase().includes(normalizedCity);
      const matchesCategory =
        !normalizedCategory || listing.category.toLowerCase().includes(normalizedCategory);
      const matchesPrice =
        !filters.maxPrice.trim() ||
        !Number.isFinite(parsedMaxPrice) ||
        listing.price === null ||
        listing.price <= parsedMaxPrice;

      return matchesSearch && matchesType && matchesCity && matchesCategory && matchesPrice;
    });
  }, [filters, listings]);

  return (
    <>
      {isLoading ? <ListingsSkeleton /> : null}
      {!isLoading && filteredListings.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing, index) => {
            const sponsorInsertIndex = filteredListings.length >= 4 ? 2 : filteredListings.length - 1;

            return (
              <Fragment key={listing.id}>
                <ListingCard listing={listing} showFeatured={showFeatured} />
                {feedSponsors.length > 0 && index === sponsorInsertIndex ? (
                  <LocalSponsorStrip
                    sponsors={feedSponsors}
                    className="sm:col-span-2 lg:col-span-3"
                  />
                ) : null}
              </Fragment>
            );
          })}
        </div>
      ) : null}
      {!isLoading && filteredListings.length === 0 ? <EmptyListingsState /> : null}

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onLoadMore}
          disabled={!canLoadMore}
          className="focus-ring inline-flex h-12 items-center justify-center rounded-lg border border-ink/12 bg-white px-5 text-base font-black text-ink transition hover:bg-field disabled:cursor-not-allowed disabled:text-ink/35"
        >
          {canLoadMore ? "Učitaj još oglasa" : "Sve učitano"}
        </button>
      </div>
    </>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <span className="mb-2 inline-flex items-center gap-2 text-sm font-black text-ink">
        <Filter aria-hidden="true" size={16} className="text-moss" />
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={type === "number" ? 0 : undefined}
        className="focus-ring h-12 w-full rounded-lg border border-ink/12 bg-white px-4 text-sm font-bold text-ink placeholder:text-ink/38"
      />
    </label>
  );
}

function ListingsSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Oglasi se učitavaju">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="h-[36rem] animate-pulse rounded-lg border border-ink/10 bg-white shadow-sm"
        >
          <div className="aspect-[4/3] rounded-t-lg bg-ink/8" />
          <div className="space-y-4 p-4">
            <div className="h-7 w-28 rounded-full bg-ink/8" />
            <div className="h-7 w-4/5 rounded bg-ink/8" />
            <div className="h-11 rounded bg-ink/8" />
            <div className="h-11 rounded bg-ink/8" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-11 rounded-lg bg-ink/8" />
              <div className="h-11 rounded-lg bg-ink/8" />
              <div className="h-11 rounded-lg bg-ink/8" />
              <div className="h-11 rounded-lg bg-ink/8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyListingsState() {
  return (
    <div className="rounded-lg border border-dashed border-ink/18 bg-white p-6 text-center">
      <h2 className="text-xl font-black text-ink">Još nema oglasa za ovaj odabir.</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/64">
        Promijeni filtere ili objavi prvi oglas za svoju ulicu, kvart ili selo.
      </p>
      <Link
        href="/novi-oglas"
        className="focus-ring mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-black text-white transition hover:bg-mossDark"
      >
        <Plus aria-hidden="true" size={18} />
        Objavi oglas
      </Link>
    </div>
  );
}
